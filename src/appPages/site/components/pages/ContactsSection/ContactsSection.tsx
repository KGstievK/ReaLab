"use client";

import Link from "next/link";
import scss from "./ContactsSection.module.scss";
import { useGetContactInfoQuery } from "../../../../../redux/api/category";

const serviceNotes = [
  {
    title: "Консультация по подбору",
    text: "Поможем выбрать конфигурацию оборудования под отделение, поток пациентов и сценарий применения.",
  },
  {
    title: "Поставка и документы",
    text: "Согласуем сроки, формат отгрузки, комплект закрывающих документов и удобный способ оплаты.",
  },
  {
    title: "Поддержка после запуска",
    text: "Если нужно уточнить статус заказа, сервисный маршрут или дооснащение, команда ReaLab на связи напрямую.",
  },
];

const buildWhatsappHref = (messenger: string) => {
  const digits = messenger.replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : undefined;
};

const ContactsSection = () => {
  const { data } = useGetContactInfoQuery();
  const contacts = data ?? [];

  return (
    <section className={scss.ContactsSection}>
      <div className="container">
        <div className={scss.breadcrumbs}>
          <Link href="/">Главная</Link>
          <span>/</span>
          <span>Контакты</span>
        </div>

        <section className={scss.hero}>
          <div className={scss.heroCopy}>
            <span className={scss.eyebrow}>Связь с ReaLab</span>
            <h1>Контакты</h1>
            <p>
              Если нужна консультация по конфигурации, поставке, документам или
              запуску оборудования, напишите нам удобным способом. Мы отвечаем
              спокойно, по делу и без лишней формальности.
            </p>
          </div>

          <div className={scss.heroAside}>
            <h2>Когда стоит написать нам</h2>
            <ul>
              <li>подобрать конфигурацию под отделение</li>
              <li>уточнить наличие и сроки поставки</li>
              <li>запросить коммерческое предложение и документы</li>
              <li>проверить статус заказа, запуска или сервиса</li>
            </ul>
          </div>
        </section>

        {contacts.length ? (
          <div className={scss.cards}>
            {contacts.map((item, index) => {
              const whatsappHref = buildWhatsappHref(item.messenger);

              return (
                <article key={`${item.email}-${index}`} className={scss.card}>
                  <span className={scss.cardEyebrow}>Основной канал</span>

                  <div className={scss.cardBlock}>
                    <h3>WhatsApp</h3>
                    {whatsappHref ? (
                      <a href={whatsappHref} target="_blank" rel="noreferrer">
                        {item.messenger}
                      </a>
                    ) : (
                      <p>{item.messenger}</p>
                    )}
                  </div>

                  <div className={scss.cardBlock}>
                    <h3>Email</h3>
                    <a href={`mailto:${item.email}`}>{item.email}</a>
                  </div>

                  <div className={scss.cardBlock}>
                    <h3>Адрес</h3>
                    <p>{item.address}</p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={scss.emptyState}>
            <span className={scss.cardEyebrow}>Контакты</span>
            <h2>Контактные данные скоро появятся</h2>
            <p>
              Страница уже готова, осталось опубликовать способы связи через админку.
            </p>
          </div>
        )}

        <section className={scss.helpSection}>
          <div className={scss.helpHeader}>
            <span className={scss.eyebrow}>Поддержка</span>
            <h2>Чем мы можем помочь</h2>
          </div>

          <div className={scss.helpGrid}>
            {serviceNotes.map((item) => (
              <article key={item.title} className={scss.helpCard}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
};

export default ContactsSection;
