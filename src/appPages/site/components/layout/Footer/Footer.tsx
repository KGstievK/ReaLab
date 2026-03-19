"use client";

import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/icons/logoWite.svg";
import { useGetContactInfoQuery } from "../../../../../redux/api/category";
import { useGetPayQuery } from "../../../../../redux/api/product";
import scss from "./Footer.module.scss";

const menuLinks = [
  { link: "/", name: "Главная" },
  { link: "/new", name: "Новинки" },
  { link: "/popular", name: "Популярное" },
  { link: "/sale", name: "Sale" },
  { link: "/catalog", name: "Каталог" },
  { link: "/about", name: "О нас" },
  { link: "/contacts", name: "Контакты" },
];

const helpItems = [
  "Доставка по Кыргызстану и миру",
  "Прозрачный расчёт стоимости доставки",
  "Понятный checkout и поддержка после заказа",
  "RU-only интерфейс в текущей версии",
];

const getWhatsAppLink = (value: string) => {
  if (!value) {
    return "#";
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const phone = value.replace(/[^\d]/g, "");
  return phone ? `https://wa.me/${phone}` : "#";
};

type FooterPaymentItem = Pay["pay_title"][number];

const Footer = () => {
  const { data: contactData } = useGetContactInfoQuery();
  const { data: payDataResponse } = useGetPayQuery();

  const contacts = Array.isArray(contactData) ? contactData[0] : contactData?.[0] || contactData;
  const payData = Array.isArray(payDataResponse) ? payDataResponse[0] : payDataResponse;
  const whatsappLink = getWhatsAppLink(contacts?.messenger || payData?.whatsapp || "");
  const paymentItems: FooterPaymentItem[] = Array.isArray(payData?.pay_title)
    ? payData.pay_title.slice(0, 3)
    : [];

  return (
    <footer className={scss.footer}>
      <div className="container">
        <div className={scss.content}>
          <div className={scss.top}>
            <div className={scss.brandColumn}>
              <Link href="/" className={scss.logo}>
                <Image src={logo} alt="ReaLab" />
              </Link>

              <p className={scss.brandText}>
                ReaLab поставляет медицинское оборудование для клиник, лабораторий и
                отделений интенсивной терапии с понятным digital-опытом и сервисной
                поддержкой.
              </p>

              {whatsappLink !== "#" ? (
                <a href={whatsappLink} target="_blank" rel="noreferrer" className={scss.socialLink}>
                  Написать в WhatsApp
                </a>
              ) : null}
            </div>

            <div className={scss.linksGrid}>
              <div className={scss.column}>
                <h3>Меню</h3>
                <ul>
                  {menuLinks.map((item) => (
                    <li key={item.link}>
                      <Link href={item.link}>{item.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={scss.column}>
                <h3>Помощь</h3>
                <ul>
                  {helpItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className={scss.column}>
                <h3>Оплата</h3>
                <ul>
                  {paymentItems.length > 0 ? (
                    paymentItems.map((item) => (
                      <li key={`${item.number}-${item.info}`}>
                        <strong>{item.number}</strong>
                        <span>{item.info}</span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li>MBank redirect</li>
                      <li>FINCA QR</li>
                      <li>Ручное подтверждение, если нужен bridge-режим</li>
                    </>
                  )}
                </ul>
              </div>

              <div className={scss.column}>
                <h3>Контакты</h3>
                <ul>
                  {contacts ? (
                    <>
                      <li>
                        <span>WhatsApp</span>
                        <a href={whatsappLink} target="_blank" rel="noreferrer">
                          {contacts.messenger}
                        </a>
                      </li>
                      <li>
                        <span>Email</span>
                        <a href={`mailto:${contacts.email}`}>{contacts.email}</a>
                      </li>
                      <li>
                        <span>Адрес</span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contacts.address)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {contacts.address}
                        </a>
                      </li>
                    </>
                  ) : (
                    <li>Контактные данные обновляются</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className={scss.bottom}>
            <p>© ReaLab Medical Systems. Все права защищены.</p>
            <p>Светлый клинический e-commerce для медицинского оборудования.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
