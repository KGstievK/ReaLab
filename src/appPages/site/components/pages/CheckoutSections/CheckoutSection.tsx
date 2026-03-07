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
  usePostOrderMutation,
} from "../../../../../redux/api/product";
import PaymentResultModal from "./PaymentResultModal";
import CheckoutPaymentStep, { CheckoutQrItem } from "./CheckoutPaymentStep";
import { isQrPaymentMethod, PaymentMethod } from "./paymentMethods";
import { notifyTelegramFrontend } from "./frontend";
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

type ResultState = "success" | "error" | null;

const DELIVERY_PRICE = 200;
const DISCOUNT_PRICE = 600;

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatSom = (value: number) => `${value.toLocaleString("ru-RU")}с`;

const CheckoutSection = () => {
  const router = useRouter();
  const { data: cart } = useGetCartQuery();
  const { data: meData } = useGetMeQuery();
  const { data: payData } = useGetPayQuery();
  const [postOrderMutation] = usePostOrderMutation();

  const [step, setStep] = useState<CheckoutStep>(1);
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("courier");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("mbank_redirect");
  const [isMobile, setIsMobile] = useState(false);
  const [resultState, setResultState] = useState<ResultState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [phoneTouched, setPhoneTouched] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    phoneNumber: "",
    city: "\u0411\u0438\u0448\u043a\u0435\u043a",
    address: "",
  });

  const phoneLocalError =
    phoneTouched &&
    formData.phoneNumber &&
    !isValidPhoneNumber(formData.phoneNumber)
      ? "Введите корректный номер"
      : "";

  const phoneError = errors.phoneNumber || phoneLocalError;

  const normalizedCart = useMemo<CartData | undefined>(() => {
    if (Array.isArray(cart)) {
      return cart[0] as CartData | undefined;
    }
    return cart as CartData | undefined;
  }, [cart]);

  const basketData = normalizedCart?.cart_items ?? [];

  useEffect(() => {
    const currentUser = Array.isArray(meData) ? meData[0] : undefined;
    if (!currentUser) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      firstName: prev.firstName || currentUser.first_name || "",
      phoneNumber: prev.phoneNumber || currentUser.number || "",
      address: prev.address || currentUser.address || "",
    }));

    setPhoneTouched(false);
  }, [meData]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 750px)");
    const sync = () => setIsMobile(media.matches);
    sync();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", sync);
      return () => media.removeEventListener("change", sync);
    }

    media.addListener(sync);
    return () => media.removeListener(sync);
  }, []);

  const subtotalByItems = basketData.reduce(
    (sum, item) => sum + toNumber(item.total_price),
    0,
  );
  const subtotal = toNumber(normalizedCart?.total_price) || subtotalByItems;
  const deliveryPrice = deliveryMethod === "courier" ? DELIVERY_PRICE : 0;
  const discountPrice = basketData.length > 0 ? DISCOUNT_PRICE : 0;
  const totalToPay = Math.max(subtotal + deliveryPrice - discountPrice, 0);

  const stepLabelThree = isMobile
    ? "ПОДТВЕРЖДЕНИЕ"
    : step === 3
      ? "ОПЛАТА"
      : "ПОДТВЕРЖДЕНИЕ";
  const pageTitle = isMobile
    ? "Оформление заказа"
    : step === 2
      ? "Доставка"
      : step === 3
        ? "Оплата"
        : "Оформление заказа";
  const desktopActionLabel = step === 3 ? "Оплатить" : "Продолжить";

  const qrItems: CheckoutQrItem[] = Array.isArray(payData)
    ? (payData[0]?.pay_title ?? [])
    : (payData?.pay_title ?? []);
  const qrWhatsapp = Array.isArray(payData)
    ? payData[0]?.whatsapp
    : payData?.whatsapp;

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
      nextErrors.firstName = "Введите имя";
    }
    if (!formData.phoneNumber.trim()) {
      nextErrors.phoneNumber = "Введите номер телефона";
    } else if (!isValidPhoneNumber(formData.phoneNumber)) {
      nextErrors.phoneNumber = "Введите корректный номер";
    }
    if (!formData.city.trim()) {
      nextErrors.city = "Выберите город";
    }
    if (!formData.address.trim()) {
      nextErrors.address = "Введите адрес";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStepTwo = () => {
    if (!deliveryMethod) {
      setErrors({ delivery: "Выберите способ получения" });
      return false;
    }

    setErrors({});
    return true;
  };

  const validatePayment = () => {
    const nextErrors: FormErrors = {};

    if (!paymentMethod) {
      nextErrors.payment = "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u043f\u043e\u0441\u043e\u0431 \u043e\u043f\u043b\u0430\u0442\u044b";
    }

    if (isQrPaymentMethod(paymentMethod) && qrItems.length === 0) {
      nextErrors.payment = "QR-\u043a\u043e\u0434 \u0432\u0440\u0435\u043c\u0435\u043d\u043d\u043e \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitOrder = async () => {
    if (!normalizedCart?.id || !normalizedCart?.user) {
      setResultState("error");
      return;
    }

    const orderData: IOrderPost = {
      order_user: normalizedCart.user,
      cart_id: normalizedCart.id,
      delivery: (deliveryMethod === "pickup"
        ? "самовывоз"
        : "курьер") as IOrderPost["delivery"],
      first_name: formData.firstName,
      phone_number: formData.phoneNumber,
      city: formData.city,
      address: formData.address,
    };

    try {
      await postOrderMutation(orderData).unwrap();

      await notifyTelegramFrontend({
        firstName: formData.firstName,
        phoneNumber: formData.phoneNumber,
        city: formData.city,
        address: formData.address,
        delivery: deliveryMethod === "pickup" ? "Самовывоз" : "Доставка",
        orderUser: normalizedCart.user,
        totalPrice: String(normalizedCart.total_price),
        items: basketData.map((item) => ({
          name: item.clothes.clothes_name,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          unitPrice: String(item.just_price),
          photos: item.clothes.clothes_img.map((img) => img.photo),
        })),
      });

      setResultState("success");
    } catch (error) {
      console.error("Order submission failed:", error);
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
                  aria-label="Назад"
                  onClick={() => router.back()}
                >
                  <Image src={backIcon} alt="" />
                </button>
                <Link href="/">Главная</Link>
                <span>/</span>
                <Link href="/cart" className={scss.current}>
                  Корзина
                </Link>
              </nav>

              <h1 className={scss.pageTitle}>{pageTitle}</h1>

              <div className={scss.stepper}>
                <div className={scss.stepItem}>
                  <div
                    className={`${scss.stepCircle} ${
                      step === 1 ? scss.active : step > 1 ? scss.completed : ""
                    }`}
                  >
                    {step > 1 ? <IoCheckmark /> : <FiUser />}
                  </div>
                  <span>Шаг 1</span>
                  <h4>ЛИЧНАЯ ИНФОРМАЦИЯ</h4>
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
                  <span>Шаг 2</span>
                  <h4>ДОСТАВКА</h4>
                </div>

                <span className={scss.stepLine} />

                <div className={scss.stepItem}>
                  <div
                    className={`${scss.stepCircle} ${step === 3 ? scss.active : ""}`}
                  >
                    <IoCardOutline />
                  </div>
                  <span>Шаг 3</span>
                  <h4>{stepLabelThree}</h4>
                </div>
              </div>

              <div className={scss.formBlock}>
                {step === 1 && (
                  <div className={scss.section}>
                    <h2>ЛИЧНАЯ ИНФОРМАЦИЯ</h2>

                    <label>
                      ИМЯ
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={handleChange("firstName")}
                        placeholder="Айгерим"
                      />
                      {errors.firstName && (
                        <p role="alert">{errors.firstName}</p>
                      )}
                    </label>

                    <label>
                      НОМЕР ТЕЛЕФОНА
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
                      ГОРОД
                      <div className={scss.cityField}>
                        <select
                          value={formData.city}
                          onChange={handleChange("city")}
                        >
                          <option value="Бишкек">Бишкек</option>
                          <option value="Ош">Ош</option>
                          <option value="Каракол">Каракол</option>
                        </select>

                        <FiChevronDown />
                      </div>
                      {errors.city && <p role="alert">{errors.city}</p>}
                    </label>

                    <label>
                      АДРЕС
                      <input
                        type="text"
                        value={formData.address}
                        onChange={handleChange("address")}
                        placeholder="ABC 12A, Бишкек, Кыргызстан"
                      />
                      {errors.address && <p role="alert">{errors.address}</p>}
                    </label>
                  </div>
                )}

                {step === 2 && (
                  <div className={scss.section}>
                    <h2>ДОСТАВКА</h2>

                    <button
                      type="button"
                      className={`${scss.deliveryCard} ${
                        deliveryMethod === "pickup" ? scss.selected : ""
                      }`}
                      onClick={() => setDeliveryMethod("pickup")}
                    >
                      <span className={scss.radio} />
                      <div>
                        <h5>Самовывоз</h5>
                        <p>1-2 рабочих дней</p>
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
                        <h5>Доставка</h5>
                        <p>за час</p>
                      </div>
                      <strong>200с</strong>
                    </button>

                    {errors.delivery && (
                      <p className={scss.commonError}>{errors.delivery}</p>
                    )}
                  </div>
                )}

                {step === 3 && (
                  <CheckoutPaymentStep
                    paymentMethod={paymentMethod}
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
                      Назад
                    </button>
                  )}

                  <Link href="/cart">Вернуть в корзину</Link>
                </div>
              </div>
            </div>

            <aside className={scss.rightColumn}>
              <h2>Детали оплаты</h2>

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
                        src={selectedImage?.photo || "/fallback-image.png"}
                        alt={item.clothes.clothes_name}
                      />
                      <div className={scss.summaryText}>
                        <h4>{item.clothes.clothes_name}</h4>
                        <p>{selectedImage?.color || "Черный"}</p>
                        <p>
                          {item.quantity} x {toNumber(item.just_price)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={scss.summaryRows}>
                <div className={scss.row}>
                  <span>Итог</span>
                  <span>{formatSom(subtotal)}</span>
                </div>
                <div className={scss.row}>
                  <span>Доставка</span>
                  <span>{formatSom(deliveryPrice)}</span>
                </div>
                <div className={scss.row}>
                  <span>Скидка</span>
                  <span>-{formatSom(discountPrice)}</span>
                </div>
                <div className={`${scss.row} ${scss.totalRow}`}>
                  <span>Итого к оплате:</span>
                  <span>{formatSom(totalToPay)}</span>
                </div>
              </div>

              <button
                type="button"
                className={scss.mainAction}
                onClick={handleMainAction}
              >
                {isSubmitting ? "Подождите..." : desktopActionLabel}
                <span>
                  {isSubmitting ? "Подождите..." : "Посмотреть все →"}
                </span>
              </button>
            </aside>
          </div>
        </div>
      </section>

      <PaymentResultModal
        type={resultState}
        onClose={() => setResultState(null)}
        onGoHome={() => router.push("/")}
      />
    </>
  );
};

export default CheckoutSection;
