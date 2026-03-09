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
import {
  PAYMENT_METHOD_OPTIONS,
  PaymentMethod,
  isQrPaymentMethod,
} from "./paymentMethods";
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

const TEXT = {
  notSelected: "\u041d\u0435 \u0432\u044b\u0431\u0440\u0430\u043d",
  cityBishkek: "\u0411\u0438\u0448\u043a\u0435\u043a",
  cityOsh: "\u041e\u0448",
  cityKarakol: "\u041a\u0430\u0440\u0430\u043a\u043e\u043b",
  phoneError: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u044b\u0439 \u043d\u043e\u043c\u0435\u0440",
  stepOneTitle: "\u041b\u0418\u0427\u041d\u0410\u042f \u0418\u041d\u0424\u041e\u0420\u041c\u0410\u0426\u0418\u042f",
  stepTwoTitle: "\u0414\u041e\u0421\u0422\u0410\u0412\u041a\u0410",
  stepThreeTitle: "\u041f\u041e\u0414\u0422\u0412\u0415\u0420\u0416\u0414\u0415\u041d\u0418\u0415",
  checkoutTitle: "\u041e\u0444\u043e\u0440\u043c\u043b\u0435\u043d\u0438\u0435 \u0437\u0430\u043a\u0430\u0437\u0430",
  confirmationTitle: "\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u0438\u0435",
  payDetails: "\u0414\u0435\u0442\u0430\u043b\u0438 \u043e\u043f\u043b\u0430\u0442\u044b",
  home: "\u0413\u043b\u0430\u0432\u043d\u0430\u044f",
  cart: "\u041a\u043e\u0440\u0437\u0438\u043d\u0430",
  back: "\u041d\u0430\u0437\u0430\u0434",
  name: "\u0418\u041c\u042f",
  phone: "\u041d\u041e\u041c\u0415\u0420 \u0422\u0415\u041b\u0415\u0424\u041e\u041d\u0410",
  city: "\u0413\u041e\u0420\u041e\u0414",
  address: "\u0410\u0414\u0420\u0415\u0421",
  namePlaceholder: "\u0410\u0439\u0433\u0435\u0440\u0438\u043c",
  addressPlaceholder:
    "ABC 12A, \u0411\u0438\u0448\u043a\u0435\u043a, \u041a\u044b\u0440\u0433\u044b\u0437\u0441\u0442\u0430\u043d",
  enterName: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0438\u043c\u044f",
  enterPhone: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043d\u043e\u043c\u0435\u0440 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0430",
  chooseCity: "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0433\u043e\u0440\u043e\u0434",
  enterAddress: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0430\u0434\u0440\u0435\u0441",
  chooseDelivery: "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u043f\u043e\u0441\u043e\u0431 \u043f\u043e\u043b\u0443\u0447\u0435\u043d\u0438\u044f",
  choosePayment: "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u043f\u043e\u0441\u043e\u0431 \u043e\u043f\u043b\u0430\u0442\u044b",
  qrUnavailable: "QR-\u043a\u043e\u0434 \u0432\u0440\u0435\u043c\u0435\u043d\u043d\u043e \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d",
  pickup: "\u0421\u0430\u043c\u043e\u0432\u044b\u0432\u043e\u0437",
  pickupApi: "\u0441\u0430\u043c\u043e\u0432\u044b\u0437\u043e\u0432",
  pickupEta: "1-2 \u0440\u0430\u0431\u043e\u0447\u0438\u0445 \u0434\u043d\u044f",
  courier: "\u0414\u043e\u0441\u0442\u0430\u0432\u043a\u0430",
  courierEta: "\u0437\u0430 \u0447\u0430\u0441",
  returnToCart: "\u0412\u0435\u0440\u043d\u0443\u0442\u044c \u0432 \u043a\u043e\u0440\u0437\u0438\u043d\u0443",
  notSpecified: "\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d",
  subtotal: "\u0418\u0442\u043e\u0433",
  delivery: "\u0414\u043e\u0441\u0442\u0430\u0432\u043a\u0430",
  discount: "\u0421\u043a\u0438\u0434\u043a\u0430",
  totalToPay: "\u0418\u0442\u043e\u0433\u043e \u043a \u043e\u043f\u043b\u0430\u0442\u0435:",
  continue: "\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c",
  continueMobile: "\u041f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c \u2192",
  pay: "\u041e\u043f\u043b\u0430\u0442\u0438\u0442\u044c",
  wait: "\u041f\u043e\u0434\u043e\u0436\u0434\u0438\u0442\u0435...",
  step: "\u0428\u0430\u0433",
} as const;

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatSom = (value: number) => `${value.toLocaleString("ru-RU")}\u0441`;

const getPaymentMethodLabel = (method: PaymentMethod) =>
  PAYMENT_METHOD_OPTIONS.find((item) => item.id === method)?.label ??
  TEXT.notSelected;

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
  const [resultState, setResultState] = useState<ResultState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

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

  const subtotalByItems = basketData.reduce(
    (sum, item) => sum + toNumber(item.total_price),
    0,
  );
  const subtotal = toNumber(normalizedCart?.total_price) || subtotalByItems;
  const deliveryPrice = deliveryMethod === "courier" ? DELIVERY_PRICE : 0;
  const discountPrice = basketData.length > 0 ? DISCOUNT_PRICE : 0;
  const totalToPay = Math.max(subtotal + deliveryPrice - discountPrice, 0);

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

    if (isQrPaymentMethod(paymentMethod) && qrItems.length === 0) {
      nextErrors.payment = TEXT.qrUnavailable;
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
        ? TEXT.pickupApi
        : "\u043a\u0443\u0440\u044c\u0435\u0440") as IOrderPost["delivery"],
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
        delivery: deliveryMethod === "pickup" ? TEXT.pickup : TEXT.courier,
        paymentMethod: getPaymentMethodLabel(paymentMethod),
        orderUser: normalizedCart.user,
        subtotal: String(subtotal),
        deliveryPrice: String(deliveryPrice),
        discountPrice: String(discountPrice),
        totalToPay: String(totalToPay),
        items: basketData.map((item) => ({
          name: item.clothes.clothes_name,
          colorName:
            item.clothes.clothes_img.find((img) => img.id === item.color)
              ?.color || TEXT.notSpecified,
          size: item.size,
          quantity: item.quantity,
          unitPrice: String(item.just_price),
          lineTotal: String(toNumber(item.just_price) * item.quantity),
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
                        <p>{TEXT.pickupEta}</p>
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
                        <p>{TEXT.courierEta}</p>
                      </div>
                      <strong>{formatSom(DELIVERY_PRICE)}</strong>
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
                        src={selectedImage?.photo || "/fallback-image.png"}
                        alt={item.clothes.clothes_name}
                      />
                      <div className={scss.summaryText}>
                        <h4>{item.clothes.clothes_name}</h4>
                        <p>{selectedImage?.color || TEXT.notSpecified}</p>
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
                  <span>{TEXT.subtotal}</span>
                  <span>{formatSom(subtotal)}</span>
                </div>
                <div className={scss.row}>
                  <span>{TEXT.delivery}</span>
                  <span>{formatSom(deliveryPrice)}</span>
                </div>
                <div className={scss.row}>
                  <span>{TEXT.discount}</span>
                  <span>-{formatSom(discountPrice)}</span>
                </div>
                <div className={`${scss.row} ${scss.totalRow}`}>
                  <span>{TEXT.totalToPay}</span>
                  <span>{formatSom(totalToPay)}</span>
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
        onClose={() => setResultState(null)}
        onGoHome={() => router.push("/")}
      />
    </>
  );
};

export default CheckoutSection;