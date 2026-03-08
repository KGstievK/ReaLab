"use client";

import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/icons/logoWite.svg";
import { useGetContactInfoQuery } from "../../../../../redux/api/category";
import scss from "./Footer.module.scss";

const menuLinks = [
  { link: "/", name: "Главная" },
  { link: "/new", name: "Новинки" },
  { link: "/catalog", name: "Категории" },
  { link: "/about", name: "О нас" },
  { link: "/contacts", name: "Контакты" },
];

const helpItems = ["Доставка", "Оплата", "Частые вопросы", "Политика конфиденциальности"];

const getWhatsAppLink = (value: string) => {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const phone = value.replace(/[^\d]/g, "");
  return phone ? `https://wa.me/${phone}` : "#";
};

const Footer = () => {
  const { data } = useGetContactInfoQuery();

  return (
    <footer className={scss.footer}>
      <div className="container">
        <div className={scss.content}>
          <div className={scss.top}>
            <div className={scss.contactsBlock}>
              <Link href="/" className={scss.logo}>
                <Image src={logo} alt="Jumana" />
              </Link>

              {data?.map((item, index) => (
                <ul key={index} className={scss.contacts}>
                  <li>
                    <span>WhatsApp</span>
                    <a href={getWhatsAppLink(item.messenger)} target="_blank" rel="noreferrer">
                      : {item.messenger}
                    </a>
                  </li>
                  <li>
                    <span>Email</span>
                    <a href={`mailto:${item.email}`}>: {item.email}</a>
                  </li>
                  <li>
                    <span>Address</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      : {item.address}
                    </a>
                  </li>
                </ul>
              ))}
            </div>

            <div className={scss.navColumns}>
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
                <h3>Обратиться за помощью</h3>
                <ul>
                  {helpItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className={scss.bottom}>
            <Link href="/" className={scss.mobileLogo}>
              <Image src={logo} alt="Jumana" />
            </Link>
            <p>All rights reserved</p>
            <p>Copyright 2024 by Jumana Fashion</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
