"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiChevronDown, FiTruck, FiUser } from "react-icons/fi";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { IoCheckmark, IoCardOutline } from "react-icons/io5";
import backIcon from "@/assets/icons/backIcon.svg";
import { useGetMeQuery } from "../../../../../redux/api/auth";
import {
  useGetCartQuery,
  useGetPayQuery,
  useGetPaymentMethodsQuery,
  useGetShippingQuoteQuery,
  usePostOrderMutation,
} from "../../../../../redux/api/product";
import PaymentResultModal from "./PaymentResultModal";
import CheckoutPaymentStep, { CheckoutQrItem } from "./CheckoutPaymentStep";
import {
  FALLBACK_PAYMENT_METHOD_OPTIONS,
  PaymentMethod,
  isQrPaymentMethod,
} from "./paymentMethods";
import { notifyTelegramFrontend } from "./frontend";
import scss from "./CheckoutSection.module.scss";
import { resolveMediaUrl } from "@/utils/media";
import { extractApiErrorInfo, getRateLimitAwareMessage } from "@/utils/apiError";

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

type CheckoutStep = 1 | 2 | 3;
type DeliveryMethod = "courier" | "pickup";

type FormData = {
  firstName: string;
  phoneNumber: string;
  city: string;
  address: string;
};

type FormErrors = Partial<Record<keyof FormData, string>> & {
  delivery?: string;
  payment?: string;
};

type SavedAddressValue = number | "manual";

type ResultState = "success" | "error" | null;

const DISCOUNT_PRICE = 0;

const TEXT = {
  notSelected: "Не выбран",
  cityBishkek: "Бишкек",
  cityOsh: "Ош",
  cityKarakol: "Каракол",
  phoneError: "Введите корректный номер",
  stepOneTitle: "КОНТАКТНЫЕ ДАННЫЕ",
  stepTwoTitle: "ПОСТАВКА",
  stepThreeTitle: "ПОДТВЕРЖДЕНИЕ",
  checkoutTitle: "Оформление поставки",
  confirmationTitle: "Подтверждение заказа",
  payDetails: "Сводка заказа",
  home: "Главная",
  cart: "Корзина",
  back: "Назад",
  name: "ИМЯ",
  phone: "НОМЕР ТЕЛЕФОНА",
  city: "ГОРОД",
  address: "АДРЕС",
  savedAddress: "СОХРАНЁННЫЙ АДРЕС",
  namePlaceholder: "Айгерим",
  addressPlaceholder:
    "ABC 12A, Бишкек, Кыргызстан",
  enterName: "Введите имя",
  enterPhone: "Введите номер телефона",
  chooseCity: "Выберите город",
  enterAddress: "Введите адрес",
  chooseDelivery: "Выберите способ получения",
  choosePayment: "Выберите способ оплаты",
  saveAddress: "Сохранить адрес организации в профиле",
  qrUnavailable: "QR-код временно недоступен",
  pickup: "Самовывоз",
  pickupApi: "самовывоз",
  pickupEta: "1-2 рабочих дня",
  courier: "Доставка",
  courierEta: "за час",
  returnToCart: "Вернуть в корзину",
  manualAddress: "Ввести вручную",
  notSpecified: "Не указан",
  subtotal: "Оборудование",
  delivery: "Доставка",
  discount: "Скидка",
  totalToPay: "Итого к оплате:",
  continue: "Продолжить",
  continueMobile: "Продолжить →",
  pay: "Оплатить",
  wait: "Подождите...",
  step: "Шаг",
} as const;

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatPrice = (value: number) => `${value.toLocaleString("ru-RU")} KGS`;

const getPaymentMethodLabel = (
  method: PaymentMethod,
  methods = FALLBACK_PAYMENT_METHOD_OPTIONS,
) =>
  methods.find((item) => item.id === method)?.label ??
  TEXT.notSelected;

const CheckoutSection = () => {
  const router = useRouter();
  const {
    data: cart,
    isLoading: isCartLoading,
    isError: isCartError,
    error: cartError,
    refetch: refetchCart,
  } = useGetCartQuery();
  const {
    data: meData,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useGetMeQuery();
  const { data: payData } = useGetPayQuery();
  const { data: paymentMethodsData } = useGetPaymentMethodsQuery();
  const [postOrderMutation] = usePostOrderMutation();

  const [step, setStep] = useState<CheckoutStep>(1);
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("courier");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("mbank_redirect");
  const [resultState, setResultState] = useState<ResultState>(null);
  const [createdOrder, setCreatedOrder] = useState<IOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [checkoutErrorMessage, setCheckoutErrorMessage] = useState("");
  const [checkoutTraceId, setCheckoutTraceId] = useState("");
  const [selectedAddressId, setSelectedAddressId] =
    useState<SavedAddressValue>("manual");
  const [saveAddress, setSaveAddress] = useState(false);

  const [phoneTouched, setPhoneTouched] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    phoneNumber: "",
    city: TEXT.cityBishkek,
    address: "",
  });

  const phoneLocalError =
    phoneTouched &&
    formData.phoneNumber &&
    !isValidPhoneNumber(formData.phoneNumber)
      ? TEXT.phoneError
      : "";

  const phoneError = errors.phoneNumber || phoneLocalError;

  const normalizedCart = useMemo<CartData | undefined>(() => {
    if (Array.isArray(cart)) {
      return cart[0] as CartData | undefined;
    }

    return cart as CartData | undefined;
  }, [cart]);

  const basketData = normalizedCart?.cart_items ?? [];
  const currentUser = Array.isArray(meData) ? meData[0] : undefined;
  const savedAddresses = currentUser?.addresses ?? [];
  const defaultAddress =
    currentUser?.default_address ??
    savedAddresses.find((item) => item.is_default) ??
    null;
  const selectedSavedAddress =
    selectedAddressId === "manual"
      ? null
      : savedAddresses.find((item) => item.id === selectedAddressId) ?? null;
  const checkoutCountry =
    selectedSavedAddress?.country ||
    defaultAddress?.country ||
    "Kyrgyzstan";

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      firstName:
        prev.firstName ||
        defaultAddress?.recipient_name ||
        currentUser.first_name ||
        "",
      phoneNumber:
        prev.phoneNumber ||
        defaultAddress?.phone_number ||
        currentUser.number ||
        "",
      city: prev.city || defaultAddress?.city || TEXT.cityBishkek,
      address:
        prev.address ||
        defaultAddress?.address ||
        currentUser.address ||
        "",
    }));

    setSelectedAddressId((prev) => (prev === "manual" && defaultAddress?.id ? defaultAddress.id : prev));
    setPhoneTouched(false);
  }, [currentUser, defaultAddress?.address, defaultAddress?.city, defaultAddress?.id, defaultAddress?.phone_number, defaultAddress?.recipient_name]);

  const handleSavedAddressChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = event.target.value;
    if (value === "manual") {
      setSelectedAddressId("manual");
      return;
    }

    const nextId = Number(value);
    const selectedAddress = savedAddresses.find((item) => item.id === nextId);
    if (!selectedAddress) {
      setSelectedAddressId("manual");
      return;
    }

    setSelectedAddressId(nextId);
    setSaveAddress(false);
    setFormData((prev) => ({
      ...prev,
      firstName: selectedAddress.recipient_name || prev.firstName,
      phoneNumber: selectedAddress.phone_number || prev.phoneNumber,
      city: selectedAddress.city || prev.city,
      address: selectedAddress.address || prev.address,
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.city;
      delete next.address;
      delete next.firstName;
      delete next.phoneNumber;
      return next;
    });
  };

  const subtotalByItems = basketData.reduce(
    (sum, item) => sum + toNumber(item.total_price),
    0,
  );
  const subtotal = toNumber(normalizedCart?.total_price) || subtotalByItems;
  const shippingRequest = {
    delivery: deliveryMethod === "pickup" ? TEXT.pickupApi : "курьер",
    city: formData.city,
    country: checkoutCountry,
    payment_method: paymentMethod,
  } as const;
  const { data: shippingQuote } = useGetShippingQuoteQuery(shippingRequest);
  const deliveryPrice = toNumber(shippingQuote?.price);
  const discountPrice = basketData.length > 0 ? DISCOUNT_PRICE : 0;
  const totalToPay = Math.max(subtotal + deliveryPrice - discountPrice, 0);
  const deliveryEtaLabel =
    shippingQuote?.eta_label ||
    (deliveryMethod === "pickup" ? TEXT.pickupEta : TEXT.courierEta);

  const pageTitle =
    step === 2
      ? TEXT.stepTwoTitle
      : step === 3
        ? TEXT.confirmationTitle
        : TEXT.checkoutTitle;
  const desktopActionLabel = step === 3 ? TEXT.pay : TEXT.continue;

  const qrItems: CheckoutQrItem[] = Array.isArray(payData)
    ? (payData[0]?.pay_title ?? [])
    : (payData?.pay_title ?? []);
  const qrWhatsapp = Array.isArray(payData)
    ? payData[0]?.whatsapp
    : payData?.whatsapp;
  const paymentMethods =
    paymentMethodsData?.filter((item) => item.is_enabled) ??
    FALLBACK_PAYMENT_METHOD_OPTIONS;

  useEffect(() => {
    if (!paymentMethods.length) {
      return;
    }

    const isCurrentAvailable = paymentMethods.some((item) => item.id === paymentMethod);
    if (!isCurrentAvailable) {
      setPaymentMethod(paymentMethods[0].id);
    }
  }, [paymentMethod, paymentMethods]);

  const handleChange =
    (field: keyof FormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    if (!formData.firstName.trim()) {
      nextErrors.firstName = TEXT.enterName;
    }
    if (!formData.phoneNumber.trim()) {
      nextErrors.phoneNumber = TEXT.enterPhone;
    } else if (!isValidPhoneNumber(formData.phoneNumber)) {
      nextErrors.phoneNumber = TEXT.phoneError;
    }
    if (!formData.city.trim()) {
      nextErrors.city = TEXT.chooseCity;
    }
    if (!formData.address.trim()) {
      nextErrors.address = TEXT.enterAddress;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStepTwo = () => {
    if (!deliveryMethod) {
      setErrors({ delivery: TEXT.chooseDelivery });
      return false;
    }

    setErrors({});
    return true;
  };

  const validatePayment = () => {
    const nextErrors: FormErrors = {};

    if (!paymentMethod) {
      nextErrors.payment = TEXT.choosePayment;
    }

    if (isQrPaymentMethod(paymentMethod, paymentMethods) && qrItems.length === 0) {
      nextErrors.payment = TEXT.qrUnavailable;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitOrder = async () => {
    if (!normalizedCart?.id || !normalizedCart?.user) {
      setCheckoutErrorMessage("Не удалось определить корзину для оформления заказа");
      setCheckoutTraceId("");
      setResultState("error");
      return;
    }

    const orderData: IOrderPost = {
      order_user: normalizedCart.user,
      cart_id: normalizedCart.id,
      delivery: (deliveryMethod === "pickup"
        ? TEXT.pickupApi
        : "курьер") as IOrderPost["delivery"],
      first_name: formData.firstName,
      phone_number: formData.phoneNumber,
      city: formData.city,
      address: formData.address,
      country: checkoutCountry,
      payment_method: paymentMethod,
      save_address: selectedAddressId === "manual" ? saveAddress : false,
    };

    try {
      const order = await postOrderMutation(orderData).unwrap();
      setCreatedOrder(order);

      await notifyTelegramFrontend({
        firstName: formData.firstName,
        phoneNumber: formData.phoneNumber,
        city: formData.city,
        address: formData.address,
        delivery: deliveryMethod === "pickup" ? TEXT.pickup : TEXT.courier,
        paymentMethod: getPaymentMethodLabel(paymentMethod, paymentMethods),
        orderUser: normalizedCart.user,
        subtotal: String(subtotal),
        deliveryPrice: String(deliveryPrice),
        discountPrice: String(discountPrice),
        totalToPay: String(totalToPay),
        items: basketData.map((item) => {
          const selectedImage = item.clothes.clothes_img.find(
            (img) => img.id === item.color,
          );
          const selectedPhoto =
            selectedImage?.photo || item.clothes.clothes_img[0]?.photo;

          return {
            name: item.clothes.clothes_name,
            colorName: selectedImage?.color || TEXT.notSpecified,
            size: item.size,
            quantity: item.quantity,
            unitPrice: String(item.just_price),
            lineTotal: String(toNumber(item.just_price) * item.quantity),
            photos: selectedPhoto ? [selectedPhoto] : [],
          };
        }),
      });

      setCheckoutErrorMessage("");
      setCheckoutTraceId("");
      setResultState("success");
    } catch (error) {
      console.error("Order submission failed:", error);
      const apiError = extractApiErrorInfo(error, "Не удалось оформить заказ");
      const nextErrors: FormErrors = {};

      if (apiError.fields.first_name) {
        nextErrors.firstName = apiError.fields.first_name;
      }
      if (apiError.fields.phone_number) {
        nextErrors.phoneNumber = apiError.fields.phone_number;
      }
      if (apiError.fields.city) {
        nextErrors.city = apiError.fields.city;
      }
      if (apiError.fields.address) {
        nextErrors.address = apiError.fields.address;
      }
      if (apiError.fields.delivery) {
        nextErrors.delivery = apiError.fields.delivery;
      }
      if (apiError.fields.payment_method) {
        nextErrors.payment = apiError.fields.payment_method;
      }

      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        setCheckoutErrorMessage("");
        setCheckoutTraceId(apiError.traceId || "");
        setCreatedOrder(null);
        setResultState(null);
        return;
      }

      setCreatedOrder(null);
      setCheckoutErrorMessage(
        getRateLimitAwareMessage(
          apiError,
          "Слишком много попыток оформления заказа. Попробуйте позже.",
        ),
      );
      setCheckoutTraceId(apiError.traceId || "");
      setResultState("error");
    }
  };

  const handleMainAction = async () => {
    if (isSubmitting) {
      return;
    }

    if (step === 1) {
      if (validateStepOne()) {
        setStep(2);
      }
      return;
    }

    if (step === 2) {
      if (validateStepTwo()) {
        setStep(3);
      }
      return;
    }

    if (!validatePayment()) {
      return;
    }

    setIsSubmitting(true);
    await submitOrder();
    setIsSubmitting(false);
  };

  const handleBackStep = () => {
    setErrors({});
    setStep((prev) => (prev > 1 ? ((prev - 1) as CheckoutStep) : prev));
  };

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.payment;
      return next;
    });
  };

  if (isCartLoading && !normalizedCart) {
    return (
      <section className={scss.CheckoutSection}>
        <div className="container">
          <div className={scss.statusState}>
            <p>Загружаем корзину для оформления заказа...</p>
          </div>
        </div>
      </section>
    );
  }

  if (isCartError && !normalizedCart) {
    return (
      <section className={scss.CheckoutSection}>
        <div className="container">
          <div className={`${scss.statusState} ${scss.statusStateError}`} role="alert">
            <p>
              {getRateLimitAwareMessage(
                extractApiErrorInfo(cartError, "Не удалось загрузить корзину"),
                "Не удалось загрузить корзину. Попробуйте позже.",
              )}
            </p>
            <div className={scss.statusActions}>
              <button type="button" onClick={() => void refetchCart()}>
                Повторить
              </button>
              <button type="button" onClick={() => router.push("/cart")}>
                Вернуться в корзину
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (basketData.length === 0) {
    return (
      <section className={scss.CheckoutSection}>
        <div className="container">
          <div className={`${scss.statusState} ${scss.statusStateEmpty}`}>
            <p>В корзине нет товаров для оформления заказа.</p>
            <div className={scss.statusActions}>
              <button type="button" onClick={() => router.push("/cart")}>
                Открыть корзину
              </button>
              <button type="button" onClick={() => router.push("/catalog")}>
                Перейти в каталог
              </button>
            </div>
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
                  {TEXT.cart}
                </Link>
              </nav>

              <h1 className={scss.pageTitle}>{pageTitle}</h1>

              {isProfileError ? (
                <div className={`${scss.inlineState} ${scss.inlineStateError}`} role="alert">
                  <p>
                    {getRateLimitAwareMessage(
                      extractApiErrorInfo(profileError, "Не удалось загрузить сохранённые адреса"),
                      "Не удалось загрузить профиль полностью. Вы всё ещё можете оформить заказ вручную.",
                    )}
                  </p>
                  <button type="button" onClick={() => void refetchProfile()}>
                    Повторить
                  </button>
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
                  <span
                    className={`${
                      step === 1 ? scss.active : step > 1 ? scss.completed : ""
                    }`}
                  >
                    {`${TEXT.step} 1`}
                  </span>
                  <h4
                    className={`${
                      step === 1 ? scss.active : step > 1 ? scss.completed : ""
                    }`}
                  >
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
                    {step > 2 ? <IoCheckmark /> : <FiTruck />}
                  </div>
                  <span
                    className={`${
                      step === 2 ? scss.active : step > 2 ? scss.completed : ""
                    }`}
                  >
                    {`${TEXT.step} 2`}
                  </span>
                  <h4
                    className={`${
                      step === 2 ? scss.active : step > 2 ? scss.completed : ""
                    }`}
                  >
                    {TEXT.stepTwoTitle}
                  </h4>
                </div>

                <span className={scss.stepLine} />

                <div className={scss.stepItem}>
                  <div
                    className={`${scss.stepCircle} ${step === 3 ? scss.active : ""}`}
                  >
                    <IoCardOutline />
                  </div>
                  <span className={`${step === 3 ? scss.active : ""}`}>
                    {`${TEXT.step} 3`}
                  </span>
                  <h4 className={`${step === 3 ? scss.active : ""}`}>
                    {TEXT.stepThreeTitle}
                  </h4>
                </div>
              </div>

              <div className={scss.formBlock}>
                {step === 1 && (
                  <div className={scss.section}>
                    <h2>{TEXT.stepOneTitle}</h2>

                    <label>
                      {TEXT.name}
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={handleChange("firstName")}
                        placeholder={TEXT.namePlaceholder}
                      />
                      {errors.firstName && <p role="alert">{errors.firstName}</p>}
                    </label>

                    <label>
                      {TEXT.phone}
                      <div
                        className={`${scss.phoneField} ${phoneError ? scss.errorField : ""}`}
                      >
                        <PhoneInput
                          international
                          defaultCountry="KG"
                          countryCallingCodeEditable={false}
                          value={formData.phoneNumber}
                          onChange={(val) => {
                            setFormData((prev) => ({
                              ...prev,
                              phoneNumber: val || "",
                            }));

                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.phoneNumber;
                              return next;
                            });
                          }}
                          onBlur={() => setPhoneTouched(true)}
                          placeholder="+996 555 000 000"
                        />
                      </div>
                      {phoneError && <p role="alert">{phoneError}</p>}
                    </label>

                    <label>
                      {TEXT.savedAddress}
                      <div className={scss.cityField}>
                        <select
                          value={selectedAddressId === "manual" ? "manual" : String(selectedAddressId)}
                          onChange={handleSavedAddressChange}
                        >
                          <option value="manual">{TEXT.manualAddress}</option>
                          {savedAddresses.map((address) => (
                            <option key={address.id} value={String(address.id)}>
                              {address.label || address.address}
                            </option>
                          ))}
                        </select>

                        <FiChevronDown />
                      </div>
                    </label>

                    <label>
                      {TEXT.city}
                      <div className={scss.cityField}>
                        <select value={formData.city} onChange={handleChange("city")}>
                          <option value={TEXT.cityBishkek}>{TEXT.cityBishkek}</option>
                          <option value={TEXT.cityOsh}>{TEXT.cityOsh}</option>
                          <option value={TEXT.cityKarakol}>{TEXT.cityKarakol}</option>
                        </select>

                        <FiChevronDown />
                      </div>
                      {errors.city && <p role="alert">{errors.city}</p>}
                    </label>

                    <label>
                      {TEXT.address}
                      <input
                        type="text"
                        value={formData.address}
                        onChange={handleChange("address")}
                        placeholder={TEXT.addressPlaceholder}
                      />
                      {errors.address && <p role="alert">{errors.address}</p>}
                    </label>

                    {currentUser && selectedAddressId === "manual" && (
                      <label className={scss.checkboxRow}>
                        <input
                          type="checkbox"
                          checked={saveAddress}
                          onChange={(event) => setSaveAddress(event.target.checked)}
                        />
                        <span>{TEXT.saveAddress}</span>
                      </label>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className={scss.section}>
                    <h2>{TEXT.stepTwoTitle}</h2>

                    <button
                      type="button"
                      className={`${scss.deliveryCard} ${
                        deliveryMethod === "pickup" ? scss.selected : ""
                      }`}
                      onClick={() => setDeliveryMethod("pickup")}
                    >
                      <span className={scss.radio} />
                      <div>
                        <h5>{TEXT.pickup}</h5>
                        <p>{deliveryMethod === "pickup" ? deliveryEtaLabel : TEXT.pickupEta}</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`${scss.deliveryCard} ${
                        deliveryMethod === "courier" ? scss.selected : ""
                      }`}
                      onClick={() => setDeliveryMethod("courier")}
                    >
                      <span className={scss.radio} />
                      <div>
                        <h5>{TEXT.courier}</h5>
                        <p>{deliveryMethod === "courier" ? deliveryEtaLabel : TEXT.courierEta}</p>
                      </div>
                      <strong>{formatPrice(deliveryPrice)}</strong>
                    </button>

                    {errors.delivery && (
                      <p className={scss.commonError}>{errors.delivery}</p>
                    )}

                    {shippingQuote?.warning ? (
                      <div className={scss.deliveryNotice} role="status">
                        <p>{shippingQuote.warning}</p>
                        <span>
                          {shippingQuote.is_live_rate
                            ? "Тариф подтверждён автоматически"
                            : "Сейчас отображается ориентировочный тариф"}
                        </span>
                      </div>
                    ) : null}
                  </div>
                )}

                {step === 3 && (
                  <CheckoutPaymentStep
                    paymentMethod={paymentMethod}
                    paymentMethods={paymentMethods}
                    onChangeMethod={handlePaymentMethodChange}
                    qrItems={qrItems}
                    qrWhatsapp={qrWhatsapp}
                    error={errors.payment}
                  />
                )}

                <div className={scss.bottomActions}>
                  {step > 1 && (
                    <button
                      type="button"
                      className={scss.backStep}
                      onClick={handleBackStep}
                    >
                      {TEXT.back}
                    </button>
                  )}

                  <Link href="/cart">{TEXT.returnToCart}</Link>
                </div>
              </div>
            </div>

            <aside className={scss.rightColumn}>
              <h2>{TEXT.payDetails}</h2>

              <div className={scss.summaryItems}>
                {basketData.map((item) => {
                  const selectedImage = item.clothes.clothes_img.find(
                    (img) => img.id === item.color,
                  );

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
                        <p>{selectedImage?.color || TEXT.notSpecified}</p>
                        <p>
                          {item.quantity} x {formatPrice(toNumber(item.just_price))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={scss.summaryRows}>
                <div className={scss.row}>
                  <span>{TEXT.subtotal}</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className={scss.row}>
                  <span>{TEXT.delivery}</span>
                  <span>{formatPrice(deliveryPrice)}</span>
                </div>
                <div className={scss.row}>
                  <span>{TEXT.discount}</span>
                  <span>-{formatPrice(discountPrice)}</span>
                </div>
                <div className={`${scss.row} ${scss.totalRow}`}>
                  <span>{TEXT.totalToPay}</span>
                  <span>{formatPrice(totalToPay)}</span>
                </div>
              </div>

              <button
                type="button"
                className={scss.mainAction}
                onClick={handleMainAction}
              >
                {isSubmitting ? TEXT.wait : desktopActionLabel}
                <span>{isSubmitting ? TEXT.wait : TEXT.continueMobile}</span>
              </button>
            </aside>
          </div>
        </div>
      </section>

      <PaymentResultModal
        type={resultState}
        orderId={createdOrder?.id ?? null}
        paymentSession={createdOrder?.payment_session ?? null}
        errorMessage={checkoutErrorMessage || null}
        traceId={checkoutTraceId || null}
        onClose={() => {
          setResultState(null);
          setCreatedOrder(null);
          setCheckoutErrorMessage("");
          setCheckoutTraceId("");
        }}
        onGoHome={() => router.push("/")}
      />
    </>
  );
};

export default CheckoutSection;

