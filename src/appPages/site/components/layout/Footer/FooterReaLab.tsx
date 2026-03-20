"use client";

import Link from "next/link";
import HexMeshLayer from "@/components/background/HexMeshLayer";
import { useGetContactInfoQuery } from "../../../../../redux/api/category";
import { useGetPayQuery } from "../../../../../redux/api/product";
import scss from "./FooterReaLab.module.scss";

const menuLinks = [
  { link: "/", name: "Главная" },
  { link: "/catalog", name: "Каталог" },
  { link: "/popular", name: "Клинический выбор" },
  { link: "/new", name: "Новые решения" },
  { link: "/sale", name: "Спецусловия" },
  { link: "/about", name: "О ReaLab" },
  { link: "/contacts", name: "Контакты" },
];

const helpItems = [
  "RFQ-first сценарий для закупки",
  "Коммерческие предложения под отделение",
  "Поддержка по внедрению и сервису",
  "Спокойная витрина для сложной медтехники",
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

const FooterReaLab = () => {
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
          <HexMeshLayer
            className={scss.surfaceMesh}
            variant="ambient"
            density="relaxed"
            interactive={false}
          />

          <div className={scss.top}>
            <div className={scss.brandColumn}>
              <div className={scss.brandLockup}>
                <span className={scss.brandMark} aria-hidden="true">
                  <span />
                </span>
                <div>
                  <strong>ReaLab</strong>
                  <span>Medical Equipment Ecosystem</span>
                </div>
              </div>

              <p className={scss.brandText}>
                ReaLab помогает клиникам, лабораториям и реабилитационным центрам
                выбирать, согласовывать и закупать оборудование через спокойный
                digital-first интерфейс.
              </p>

              {whatsappLink !== "#" ? (
                <a href={whatsappLink} target="_blank" rel="noreferrer" className={scss.socialLink}>
                  Написать в отдел продаж
                </a>
              ) : null}
            </div>

            <div className={scss.linksGrid}>
              <div className={scss.column}>
                <h3>Навигация</h3>
                <ul>
                  {menuLinks.map((item) => (
                    <li key={item.link}>
                      <Link href={item.link}>{item.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={scss.column}>
                <h3>Для закупки</h3>
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
                      <li>Invoice / Bank transfer</li>
                      <li>Stage payment</li>
                      <li>Коммерческое сопровождение сделки</li>
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
            <p>© ReaLab. Коммерческая платформа медицинского оборудования.</p>
            <p>RFQ, консультации и сопровождение закупки в едином интерфейсе.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterReaLab;
