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
  isQrPaymentMethod,
  PAYMENT_METHOD_OPTIONS,
  PaymentMethod,
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

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatSom = (value: number) => `${value.toLocaleString("ru-RU")}СЃ`;

const getPaymentMethodLabel = (method: PaymentMethod) =>
  PAYMENT_METHOD_OPTIONS.find((item) => item.id === method)?.label ??
  "РќРµ РІС‹Р±СЂР°РЅ";

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
      ? "Р’РІРµРґРёС‚Рµ РєРѕСЂСЂРµРєС‚РЅС‹Р№ РЅРѕРјРµСЂ"
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
    ? "РџРћР”РўР’Р•Р Р–Р”Р•РќРР•"
    : step === 3
      ? "РћРџР›РђРўРђ"
      : "РџРћР”РўР’Р•Р Р–Р”Р•РќРР•";
  const pageTitle = isMobile
    ? "РћС„РѕСЂРјР»РµРЅРёРµ Р·Р°РєР°Р·Р°"
    : step === 2
      ? "Р”РѕСЃС‚Р°РІРєР°"
      : step === 3
        ? "РћРїР»Р°С‚Р°"
        : "РћС„РѕСЂРјР»РµРЅРёРµ Р·Р°РєР°Р·Р°";
  const desktopActionLabel = step === 3 ? "РћРїР»Р°С‚РёС‚СЊ" : "РџСЂРѕРґРѕР»Р¶РёС‚СЊ";

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
      nextErrors.firstName = "Р’РІРµРґРёС‚Рµ РёРјСЏ";
    }
    if (!formData.phoneNumber.trim()) {
      nextErrors.phoneNumber = "Р’РІРµРґРёС‚Рµ РЅРѕРјРµСЂ С‚РµР»РµС„РѕРЅР°";
    } else if (!isValidPhoneNumber(formData.phoneNumber)) {
      nextErrors.phoneNumber = "Р’РІРµРґРёС‚Рµ РєРѕСЂСЂРµРєС‚РЅС‹Р№ РЅРѕРјРµСЂ";
    }
    if (!formData.city.trim()) {
      nextErrors.city = "Р’С‹Р±РµСЂРёС‚Рµ РіРѕСЂРѕРґ";
    }
    if (!formData.address.trim()) {
      nextErrors.address = "Р’РІРµРґРёС‚Рµ Р°РґСЂРµСЃ";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStepTwo = () => {
    if (!deliveryMethod) {
      setErrors({ delivery: "Р’С‹Р±РµСЂРёС‚Рµ СЃРїРѕСЃРѕР± РїРѕР»СѓС‡РµРЅРёСЏ" });
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
        ? "СЃР°РјРѕРІС‹РІРѕР·"
        : "РєСѓСЂСЊРµСЂ") as IOrderPost["delivery"],
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
              ?.color || "Не указан",
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
                  aria-label="РќР°Р·Р°Рґ"
                  onClick={() => router.back()}
                >
                  <Image src={backIcon} alt="" />
                </button>
                <Link href="/">Р“Р»Р°РІРЅР°СЏ</Link>
                <span>/</span>
                <Link href="/cart" className={scss.current}>
                  РљРѕСЂР·РёРЅР°
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
                  <span className={`${
                      step === 1 ? scss.active : step > 1 ? scss.completed : ""
                    }`}>РЁР°Рі 1</span>
                  <h4 className={`${
                      step === 1 ? scss.active : step > 1 ? scss.completed : ""
                    }`}>Р›РР§РќРђРЇ РРќР¤РћР РњРђР¦РРЇ</h4>
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
                  <span className={`${
                      step === 2 ? scss.active : step > 2 ? scss.completed : ""
                    }`}>РЁР°Рі 2</span>
                  <h4 className={`${
                      step === 2 ? scss.active : step > 2 ? scss.completed : ""
                    }`}>Р”РћРЎРўРђР’РљРђ</h4>
                </div>

                <span className={scss.stepLine} />

                <div className={scss.stepItem}>
                  <div
                    className={`${scss.stepCircle} ${step === 3 ? scss.active : ""}`}
                  >
                    <IoCardOutline />
                  </div>
                  <span className={`${
                      step === 3 ? scss.active : step > 3 ? scss.completed : ""
                    }`}>РЁР°Рі 3</span>
                  <h4>{stepLabelThree}</h4>
                </div>
              </div>

              <div className={scss.formBlock}>
                {step === 1 && (
                  <div className={scss.section}>
                    <h2>Р›РР§РќРђРЇ РРќР¤РћР РњРђР¦РРЇ</h2>

                    <label>
                      РРњРЇ
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={handleChange("firstName")}
                        placeholder="РђР№РіРµСЂРёРј"
                      />
                      {errors.firstName && (
                        <p role="alert">{errors.firstName}</p>
                      )}
                    </label>

                    <label>
                      РќРћРњР•Р  РўР•Р›Р•Р¤РћРќРђ
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
                      Р“РћР РћР”
                      <div className={scss.cityField}>
                        <select
                          value={formData.city}
                          onChange={handleChange("city")}
                        >
                          <option value="Р‘РёС€РєРµРє">Р‘РёС€РєРµРє</option>
                          <option value="РћС€">РћС€</option>
                          <option value="РљР°СЂР°РєРѕР»">РљР°СЂР°РєРѕР»</option>
                        </select>

                        <FiChevronDown />
                      </div>
                      {errors.city && <p role="alert">{errors.city}</p>}
                    </label>

                    <label>
                      РђР”Р Р•РЎ
                      <input
                        type="text"
                        value={formData.address}
                        onChange={handleChange("address")}
                        placeholder="ABC 12A, Р‘РёС€РєРµРє, РљС‹СЂРіС‹Р·СЃС‚Р°РЅ"
                      />
                      {errors.address && <p role="alert">{errors.address}</p>}
                    </label>
                  </div>
                )}

                {step === 2 && (
                  <div className={scss.section}>
                    <h2>Р”РћРЎРўРђР’РљРђ</h2>

                    <button
                      type="button"
                      className={`${scss.deliveryCard} ${
                        deliveryMethod === "pickup" ? scss.selected : ""
                      }`}
                      onClick={() => setDeliveryMethod("pickup")}
                    >
                      <span className={scss.radio} />
                      <div>
                        <h5>РЎР°РјРѕРІС‹РІРѕР·</h5>
                        <p>1-2 СЂР°Р±РѕС‡РёС… РґРЅРµР№</p>
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
                        <h5>Р”РѕСЃС‚Р°РІРєР°</h5>
                        <p>Р·Р° С‡Р°СЃ</p>
                      </div>
                      <strong>200СЃ</strong>
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
                      РќР°Р·Р°Рґ
                    </button>
                  )}

                  <Link href="/cart">Р’РµСЂРЅСѓС‚СЊ РІ РєРѕСЂР·РёРЅСѓ</Link>
                </div>
              </div>
            </div>

            <aside className={scss.rightColumn}>
              <h2>Р”РµС‚Р°Р»Рё РѕРїР»Р°С‚С‹</h2>

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
                        <p>{selectedImage?.color || "Р§РµСЂРЅС‹Р№"}</p>
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
                  <span>РС‚РѕРі</span>
                  <span>{formatSom(subtotal)}</span>
                </div>
                <div className={scss.row}>
                  <span>Р”РѕСЃС‚Р°РІРєР°</span>
                  <span>{formatSom(deliveryPrice)}</span>
                </div>
                <div className={scss.row}>
                  <span>РЎРєРёРґРєР°</span>
                  <span>-{formatSom(discountPrice)}</span>
                </div>
                <div className={`${scss.row} ${scss.totalRow}`}>
                  <span>РС‚РѕРіРѕ Рє РѕРїР»Р°С‚Рµ:</span>
                  <span>{formatSom(totalToPay)}</span>
                </div>
              </div>

              <button
                type="button"
                className={scss.mainAction}
                onClick={handleMainAction}
              >
                {isSubmitting ? "РџРѕРґРѕР¶РґРёС‚Рµ..." : desktopActionLabel}
                <span>
                  {isSubmitting ? "РџРѕРґРѕР¶РґРёС‚Рµ..." : "РџРѕСЃРјРѕС‚СЂРµС‚СЊ РІСЃРµ в†’"}
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
