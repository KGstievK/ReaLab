import Link from "next/link";
import scss from "./Footer.module.scss";
import Image from "next/image";
import logo from "@/assets/icons/logoWite.svg";
import { useGetContactInfoQuery } from "../../../../../redux/api/category";

const Footer = () => {
  const { data } = useGetContactInfoQuery();

  const links = [
    { link: "/", name: "\u0413\u043b\u0430\u0432\u043d\u0430\u044f" },
    { link: "/new", name: "\u041d\u043e\u0432\u0438\u043d\u043a\u0438" },
    { link: "/catalog", name: "\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438" },
    { link: "/about", name: "\u041e \u043d\u0430\u0441" },
    { link: "/contacts", name: "\u041a\u043e\u043d\u0442\u0430\u043a\u0442\u044b" },
  ];

  const help = [
    "\u0414\u043e\u0441\u0442\u0430\u0432\u043a\u0430",
    "\u041e\u043f\u043b\u0430\u0442\u0430",
    "\u0427\u0430\u0441\u0442\u044b\u0435 \u0432\u043e\u043f\u0440\u043e\u0441\u044b",
    "\u041f\u043e\u043b\u0438\u0442\u0438\u043a\u0430 \u043a\u043e\u043d\u0444\u0438\u0434\u0435\u043d\u0446\u0438\u0430\u043b\u044c\u043d\u043e\u0441\u0442\u0438",
  ];

  const getWhatsAppLink = (value: string) => {
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }

    const cleanPhone = value.replace(/[^\d]/g, "");
    return cleanPhone ? `https://wa.me/${cleanPhone}` : "#";
  };

  return (
    <footer className={scss.Footer}>
      <div className="container">
        <div className={scss.content}>
          <div className={scss.footerTop}>
            <div className={scss.footerContacts}>
              <div className={scss.footerLogo}>
                <Link href="/">
                  <Image src={logo} alt="Logo" />
                </Link>
              </div>

              {data?.map((item, idx) => (
                <ul key={idx} className={scss.footerUl}>
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

            <div className={scss.navigation}>
              <div className={scss.footerNav}>
                <h2>{"\u041c\u0435\u043d\u044e"}</h2>
                <ul>
                  {links.map((item) => (
                    <li key={item.link}>
                      <Link href={item.link}>{item.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={scss.footerHelp}>
                <h2>
                  {
                    "\u041e\u0431\u0440\u0430\u0442\u0438\u0442\u044c\u0441\u044f \u0437\u0430 \u043f\u043e\u043c\u043e\u0449\u044c\u044e"
                  }
                </h2>
                <ul>
                  {help.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className={scss.Corporation}>
            <p>All rights reserved</p>
            <p>Copyright 2024 By Jumana Fashion</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
