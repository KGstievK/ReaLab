"use client";

import scss from "./ContactsSection.module.scss";
import { useGetContactInfoQuery } from "../../../../../redux/api/category";

const ContactsSection = () => {
  const { data } = useGetContactInfoQuery();

  return (
    <section className={scss.ContactsSection}>
      <div className="container">
        <div className={scss.content}>
          <h1>Контакты</h1>
          {data?.length ? (
            data.map((item, index) => (
              <div key={index}>
                <p>
                  WhatsApp:{" "}
                  <a
                    href={`https://wa.me/${item.messenger.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.messenger}
                  </a>
                </p>
                <p>
                  Email: <a href={`mailto:${item.email}`}>{item.email}</a>
                </p>
                <p>{item.address}</p>
              </div>
            ))
          ) : (
            <p>Контактные данные появятся здесь.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default ContactsSection;
