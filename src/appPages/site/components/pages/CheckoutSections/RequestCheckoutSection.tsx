"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiBriefcase, FiChevronDown, FiFileText, FiUser } from "react-icons/fi";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { IoCheckmark } from "react-icons/io5";
import backIcon from "@/assets/icons/backIcon.svg";
import { useGetMeQuery } from "../../../../../redux/api/auth";
import {
  useGetCartQuery,
  usePostLeadRequestMutation,
  usePostProfileLeadRequestMutation,
} from "../../../../../redux/api/product";
import { getStoredAccessToken } from "@/utils/authStorage";
import { resolveMediaUrl } from "@/utils/media";
import { extractApiErrorInfo, getRateLimitAwareMessage } from "@/utils/apiError";
import LeadRequestResultModal from "./LeadRequestResultModal";
import scss from "./CheckoutSection.module.scss";

interface CartItem {
  id: number;
  clothes: {
    clothes_name: string;
    clothes_img: Array<{
      id: number;
      photo: string;
      color: string;
    }>;
  };
  size: string;
  color: number;
  quantity: number;
  price_clothes: string | number;
  total_price: string | number;
  color_id: number;
  clothes_id: number;
  just_price: string | number;
}

interface CartData {
  id: number;
  user: number;
  total_price: string | number;
  cart_items: CartItem[];
}

type RequestStep = 1 | 2 | 3;
type ResultState = "success" | "error" | null;

type FormData = {
  name: string;
  phone: string;
  email: string;
  company: string;
  roleTitle: string;
  city: string;
  country: string;
  organizationType: string;
  requestPurpose: string;
  comment: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const ORGANIZATION_OPTIONS = [
  "Частная клиника",
  "Государственное учреждение",
  "Лаборатория",
  "Реабилитационный центр",
  "Дилер / партнер",
  "Частный специалист",
] as const;

const PURPOSE_OPTIONS = [
  "Запрос КП",
  "Подбор оборудования",
  "Консультация по конфигурации",
  "Запрос демонстрации",
  "Сервис и внедрение",
] as const;

const TEXT = {
  home: "Главная",
  basket: "Список запроса",
  back: "Назад",
  pageTitle: "Запрос коммерческого предложения",
  stepOneTitle: "Контакты",
  stepTwoTitle: "Контекст запроса",
  stepThreeTitle: "Подтверждение",
  name: "Контактное лицо",
  phone: "Телефон",
  email: "Email",
  company: "Компания",
  roleTitle: "Должность",
  city: "Город",
  country: "Страна",
  organizationType: "Тип организации",
  requestPurpose: "Цель запроса",
  comment: "Комментарий",
  summaryTitle: "Сводка запроса",
  basketEmpty: "Позиции пока не добавлены. Вы все равно можете отправить общий запрос на подбор оборудования.",
  subtotal: "Ориентир по каталогу",
  units: "Единиц оборудования",
  positions: "Позиций",
  note:
    "Финальная стоимость, логистика, документы и сервис уточняются после проверки конфигурации менеджером ReaLab.",
  continue: "Продолжить",
  submit: "Отправить запрос",
  wait: "Отправляем...",
  returnToBasket: "Вернуться к списку",
  loadingCart: "Загружаем список оборудования для запроса...",
  invalidPhone: "Введите корректный номер",
  invalidEmail: "Введите корректный email",
  requiredName: "Укажите контактное лицо",
  requiredPhone: "Укажите номер телефона",
  requiredEmail: "Укажите email",
} as const;

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatPrice = (value: number) =>
  `${new Intl.NumberFormat("ru-RU").format(Math.round(value))} KGS`;

const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

const RequestCheckoutSection = () => {
  const router = useRouter();
  const hasAccessToken = Boolean(getStoredAccessToken());
  const [step, setStep] = useState<RequestStep>(1);
  const [resultState, setResultState] = useState<ResultState>(null);
  const [requestResult, setRequestResult] = useState<LeadRequest | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestErrorMessage, setRequestErrorMessage] = useState("");
  const [requestTraceId, setRequestTraceId] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);

  const { data: cart, isLoading: isCartLoading, isError: isCartError, error: cartError } =
    useGetCartQuery(undefined, {
      skip: !hasAccessToken,
    });
  const { data: meData } = useGetMeQuery(undefined, {
    skip: !hasAccessToken,
  });
  const [postLeadRequestMutation] = usePostLeadRequestMutation();
  const [postProfileLeadRequestMutation] = usePostProfileLeadRequestMutation();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    company: "",
    roleTitle: "",
    city: "",
    country: "Kyrgyzstan",
    organizationType: ORGANIZATION_OPTIONS[0],
    requestPurpose: PURPOSE_OPTIONS[0],
    comment: "",
  });

  const normalizedCart = useMemo<CartData | undefined>(() => {
    if (Array.isArray(cart)) {
      return cart[0] as CartData | undefined;
    }

    return cart as CartData | undefined;
  }, [cart]);

  const basketData = normalizedCart?.cart_items ?? [];
  const currentUser = Array.isArray(meData) ? meData[0] : undefined;
  const estimatedSubtotal = toNumber(normalizedCart?.total_price);
  const totalUnits = basketData.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const defaultAddress =
      currentUser.default_address ||
      currentUser.addresses?.find?.((item: { is_default?: boolean }) => item.is_default) ||
      null;

    setFormData((prev) => ({
      ...prev,
      name: prev.name || currentUser.first_name || currentUser.username || "",
      phone: prev.phone || currentUser.number || defaultAddress?.phone_number || "",
      email: prev.email || currentUser.email || "",
      city: prev.city || defaultAddress?.city || "",
      country: prev.country || defaultAddress?.country || "Kyrgyzstan",
    }));
  }, [currentUser]);

  const phoneLocalError =
    phoneTouched && formData.phone && !isValidPhoneNumber(formData.phone)
      ? TEXT.invalidPhone
      : "";
  const phoneError = errors.phone || phoneLocalError;

  const handleFieldChange =
    (field: keyof FormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    };

  const validateStepOne = () => {
    const nextErrors: FormErrors = {};

    if (!formData.name.trim()) nextErrors.name = TEXT.requiredName;
    if (!formData.phone.trim()) nextErrors.phone = TEXT.requiredPhone;
    else if (!isValidPhoneNumber(formData.phone)) nextErrors.phone = TEXT.invalidPhone;
    if (!formData.email.trim()) nextErrors.email = TEXT.requiredEmail;
    else if (!isValidEmail(formData.email)) nextErrors.email = TEXT.invalidEmail;

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitRequest = async () => {
    const payload: LeadRequestCreatePayload = {
      kind: "rfq",
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      company: formData.company.trim(),
      role_title: formData.roleTitle.trim(),
      city: formData.city.trim(),
      country: formData.country.trim(),
      organization_type: formData.organizationType.trim(),
      request_purpose: formData.requestPurpose.trim(),
      comment: formData.comment.trim(),
      source_path: "/cart/checkout",
      items: basketData.map((item) => {
        const selectedImage =
          item.clothes.clothes_img.find((image) => image.id === item.color) ||
          item.clothes.clothes_img[0];

        return {
          product_id: item.clothes_id,
          quantity: item.quantity,
          configuration_label: item.size,
          color_label: selectedImage?.color || "",
          product_name: item.clothes.clothes_name,
          image_url: selectedImage?.photo || "",
        };
      }),
    };

    try {
      const nextRequest = hasAccessToken
        ? await postProfileLeadRequestMutation(payload).unwrap()
        : await postLeadRequestMutation(payload).unwrap();

      setRequestResult(nextRequest);
      setRequestErrorMessage("");
      setRequestTraceId("");
      setResultState("success");
    } catch (error) {
      const apiError = extractApiErrorInfo(error, "Не удалось отправить запрос");
      const nextErrors: FormErrors = {};

      if (apiError.fields.name) nextErrors.name = apiError.fields.name;
      if (apiError.fields.phone) nextErrors.phone = apiError.fields.phone;
      if (apiError.fields.email) nextErrors.email = apiError.fields.email;
      if (apiError.fields.company) nextErrors.company = apiError.fields.company;
      if (apiError.fields.role_title) nextErrors.roleTitle = apiError.fields.role_title;
      if (apiError.fields.city) nextErrors.city = apiError.fields.city;
      if (apiError.fields.country) nextErrors.country = apiError.fields.country;
      if (apiError.fields.organization_type) nextErrors.organizationType = apiError.fields.organization_type;
      if (apiError.fields.request_purpose) nextErrors.requestPurpose = apiError.fields.request_purpose;
      if (apiError.fields.comment) nextErrors.comment = apiError.fields.comment;

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        setResultState(null);
        return;
      }

      setRequestResult(null);
      setRequestErrorMessage(
        getRateLimitAwareMessage(
          apiError,
          "Слишком много запросов за короткое время. Попробуйте немного позже.",
        ),
      );
      setRequestTraceId(apiError.traceId || "");
      setResultState("error");
    }
  };

  const handleMainAction = async () => {
    if (isSubmitting) return;
    if (step === 1) {
      if (validateStepOne()) setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }
    setIsSubmitting(true);
    await submitRequest();
    setIsSubmitting(false);
  };

  if (hasAccessToken && isCartLoading && !normalizedCart) {
    return (
      <section className={scss.CheckoutSection}>
        <div className="container">
          <div className={scss.statusState}>
            <p>{TEXT.loadingCart}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className={scss.CheckoutSection}>
        <div className="container">
          <div className={scss.content}>
            <div className={scss.leftColumn}>
              <nav className={scss.breadcrumbs} aria-label="breadcrumb">
                <button
                  type="button"
                  className={scss.backButton}
                  aria-label={TEXT.back}
                  onClick={() => router.back()}
                >
                  <Image src={backIcon} alt="" />
                </button>
                <Link href="/">{TEXT.home}</Link>
                <span>/</span>
                <Link href="/cart" className={scss.current}>
                  {TEXT.basket}
                </Link>
              </nav>

              <h1 className={scss.pageTitle}>{TEXT.pageTitle}</h1>

              {hasAccessToken && isCartError ? (
                <div className={`${scss.inlineState} ${scss.inlineStateError}`} role="alert">
                  <p>
                    {getRateLimitAwareMessage(
                      extractApiErrorInfo(cartError, "Не удалось загрузить список оборудования"),
                      "Не удалось получить состав списка. Вы все еще можете отправить общий запрос.",
                    )}
                  </p>
                </div>
              ) : null}

              <div className={scss.stepper}>
                <div className={scss.stepItem}>
                  <div
                    className={`${scss.stepCircle} ${
                      step === 1 ? scss.active : step > 1 ? scss.completed : ""
                    }`}
                  >
                    {step > 1 ? <IoCheckmark /> : <FiUser />}
                  </div>
                  <span className={`${step === 1 ? scss.active : step > 1 ? scss.completed : ""}`}>
                    Шаг 1
                  </span>
                  <h4 className={`${step === 1 ? scss.active : step > 1 ? scss.completed : ""}`}>
                    {TEXT.stepOneTitle}
                  </h4>
                </div>

                <span className={scss.stepLine} />

                <div className={scss.stepItem}>
                  <div
                    className={`${scss.stepCircle} ${
                      step === 2 ? scss.active : step > 2 ? scss.completed : ""
                    }`}
                  >
                    {step > 2 ? <IoCheckmark /> : <FiBriefcase />}
                  </div>
                  <span className={`${step === 2 ? scss.active : step > 2 ? scss.completed : ""}`}>
                    Шаг 2
                  </span>
                  <h4 className={`${step === 2 ? scss.active : step > 2 ? scss.completed : ""}`}>
                    {TEXT.stepTwoTitle}
                  </h4>
                </div>

                <span className={scss.stepLine} />

                <div className={scss.stepItem}>
                  <div className={`${scss.stepCircle} ${step === 3 ? scss.active : ""}`}>
                    <FiFileText />
                  </div>
                  <span className={`${step === 3 ? scss.active : ""}`}>Шаг 3</span>
                  <h4 className={`${step === 3 ? scss.active : ""}`}>{TEXT.stepThreeTitle}</h4>
                </div>
              </div>

              <div className={scss.formBlock}>
                {step === 1 ? (
                  <div className={scss.section}>
                    <h2>{TEXT.stepOneTitle}</h2>

                    <label>
                      {TEXT.name}
                      <input
                        type="text"
                        value={formData.name}
                        onChange={handleFieldChange("name")}
                        placeholder="Айгерим Садыкова"
                      />
                      {errors.name ? <p role="alert">{errors.name}</p> : null}
                    </label>

                    <label>
                      {TEXT.phone}
                      <div className={`${scss.phoneField} ${phoneError ? scss.errorField : ""}`}>
                        <PhoneInput
                          international
                          defaultCountry="KG"
                          countryCallingCodeEditable={false}
                          value={formData.phone}
                          onChange={(value) => {
                            setFormData((prev) => ({
                              ...prev,
                              phone: value || "",
                            }));
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.phone;
                              return next;
                            });
                          }}
                          onBlur={() => setPhoneTouched(true)}
                          placeholder="+996 555 000 000"
                        />
                      </div>
                      {phoneError ? <p role="alert">{phoneError}</p> : null}
                    </label>

                    <label>
                      {TEXT.email}
                      <input
                        type="email"
                        value={formData.email}
                        onChange={handleFieldChange("email")}
                        placeholder="procurement@clinic.kg"
                      />
                      {errors.email ? <p role="alert">{errors.email}</p> : null}
                    </label>

                    <label>
                      {TEXT.company}
                      <input
                        type="text"
                        value={formData.company}
                        onChange={handleFieldChange("company")}
                        placeholder="ReaLab Clinic"
                      />
                      {errors.company ? <p role="alert">{errors.company}</p> : null}
                    </label>

                    <label>
                      {TEXT.roleTitle}
                      <input
                        type="text"
                        value={formData.roleTitle}
                        onChange={handleFieldChange("roleTitle")}
                        placeholder="Менеджер по закупкам"
                      />
                      {errors.roleTitle ? <p role="alert">{errors.roleTitle}</p> : null}
                    </label>
                  </div>
                ) : null}

                {step === 2 ? (
                  <div className={scss.section}>
                    <h2>{TEXT.stepTwoTitle}</h2>

                    <label>
                      {TEXT.city}
                      <input
                        type="text"
                        value={formData.city}
                        onChange={handleFieldChange("city")}
                        placeholder="Бишкек"
                      />
                      {errors.city ? <p role="alert">{errors.city}</p> : null}
                    </label>

                    <label>
                      {TEXT.country}
                      <input
                        type="text"
                        value={formData.country}
                        onChange={handleFieldChange("country")}
                        placeholder="Kyrgyzstan"
                      />
                      {errors.country ? <p role="alert">{errors.country}</p> : null}
                    </label>

                    <label>
                      {TEXT.organizationType}
                      <div className={scss.cityField}>
                        <select
                          value={formData.organizationType}
                          onChange={handleFieldChange("organizationType")}
                        >
                          {ORGANIZATION_OPTIONS.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                        <FiChevronDown />
                      </div>
                      {errors.organizationType ? <p role="alert">{errors.organizationType}</p> : null}
                    </label>

                    <label>
                      {TEXT.requestPurpose}
                      <div className={scss.cityField}>
                        <select
                          value={formData.requestPurpose}
                          onChange={handleFieldChange("requestPurpose")}
                        >
                          {PURPOSE_OPTIONS.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                        <FiChevronDown />
                      </div>
                      {errors.requestPurpose ? <p role="alert">{errors.requestPurpose}</p> : null}
                    </label>

                    <label>
                      {TEXT.comment}
                      <textarea
                        value={formData.comment}
                        onChange={handleFieldChange("comment")}
                        placeholder="Опишите отделение, сценарий применения, требования по комплектации или тендерный контекст."
                      />
                      {errors.comment ? <p role="alert">{errors.comment}</p> : null}
                    </label>
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className={scss.section}>
                    <h2>{TEXT.stepThreeTitle}</h2>
                    <div className={scss.deliveryNotice}>
                      <p>
                        Мы отправим менеджеру состав выбранного оборудования, контактные данные и
                        ваш коммерческий контекст одним запросом.
                      </p>
                      <span>
                        Если список пока пустой, заявка уйдет как общий запрос на подбор решения.
                      </span>
                    </div>

                    <div className={scss.paymentInfoCard}>
                      <h4>Контакт</h4>
                      <p>
                        {formData.name} · {formData.phone}
                      </p>
                      <p>{formData.email}</p>
                      {formData.company ? <p>{formData.company}</p> : null}
                    </div>

                    <div className={scss.paymentInfoCard}>
                      <h4>Контекст</h4>
                      <p>{formData.requestPurpose || "Общий RFQ"}</p>
                      <p>
                        {formData.organizationType}
                        {formData.city ? ` · ${formData.city}` : ""}
                        {formData.country ? `, ${formData.country}` : ""}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className={scss.bottomActions}>
                  {step > 1 ? (
                    <button
                      type="button"
                      className={scss.backStep}
                      onClick={() => {
                        setErrors({});
                        setStep((prev) => (prev > 1 ? ((prev - 1) as RequestStep) : prev));
                      }}
                    >
                      {TEXT.back}
                    </button>
                  ) : null}

                  <Link href="/cart">{TEXT.returnToBasket}</Link>
                </div>
              </div>
            </div>

            <aside className={scss.rightColumn}>
              <h2>{TEXT.summaryTitle}</h2>

              <div className={scss.summaryItems}>
                {basketData.length ? (
                  basketData.map((item) => {
                    const selectedImage =
                      item.clothes.clothes_img.find((img) => img.id === item.color) ||
                      item.clothes.clothes_img[0];

                    return (
                      <div key={item.id} className={scss.summaryItem}>
                        <Image
                          width={84}
                          height={90}
                          src={resolveMediaUrl(selectedImage?.photo) || "/fallback-image.png"}
                          alt={item.clothes.clothes_name}
                        />
                        <div className={scss.summaryText}>
                          <h4>{item.clothes.clothes_name}</h4>
                          <p>{item.size || "Конфигурация уточняется"}</p>
                          <p>
                            {item.quantity} x {formatPrice(toNumber(item.just_price))}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={`${scss.statusState} ${scss.statusStateEmpty}`}>
                    <p>{TEXT.basketEmpty}</p>
                  </div>
                )}
              </div>

              <div className={scss.summaryRows}>
                <div className={scss.row}>
                  <span>{TEXT.positions}</span>
                  <span>{basketData.length}</span>
                </div>
                <div className={scss.row}>
                  <span>{TEXT.units}</span>
                  <span>{totalUnits}</span>
                </div>
                <div className={`${scss.row} ${scss.totalRow}`}>
                  <span>{TEXT.subtotal}</span>
                  <span>{formatPrice(estimatedSubtotal)}</span>
                </div>
              </div>

              <div className={scss.deliveryNotice}>
                <p>{TEXT.note}</p>
              </div>

              <button type="button" className={scss.mainAction} onClick={() => void handleMainAction()}>
                {isSubmitting ? TEXT.wait : step === 3 ? TEXT.submit : TEXT.continue}
                <span>{isSubmitting ? TEXT.wait : step === 3 ? TEXT.submit : TEXT.continue}</span>
              </button>
            </aside>
          </div>
        </div>
      </section>

      <LeadRequestResultModal
        type={resultState}
        requestNumber={requestResult?.request_number ?? null}
        errorMessage={requestErrorMessage || null}
        traceId={requestTraceId || null}
        onClose={() => {
          setResultState(null);
          setRequestResult(null);
          setRequestErrorMessage("");
          setRequestTraceId("");
        }}
        onGoHome={() => router.push("/")}
        onViewRequests={
          hasAccessToken
            ? () => {
                router.push("/profile/history");
              }
            : undefined
        }
      />
    </>
  );
};

export default RequestCheckoutSection;
