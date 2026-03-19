"use client";

import Link from "next/link";
import { FiArrowRight, FiCheckCircle, FiMail, FiMapPin, FiMessageCircle } from "react-icons/fi";
import { useGetContactInfoQuery } from "@/redux/api/category";
import scss from "./ContactsReaLabPage.module.scss";

const supportLanes = [
  {
    title: "Коммерческий запрос",
    text: "Подберем оборудование, составим КП и сверим комплектацию под клинический сценарий.",
  },
  {
    title: "Тендер и procurement",
    text: "Поможем с матрицей выбора, структурой ассортимента и данными для внутреннего согласования.",
  },
  {
    title: "Сервис и внедрение",
    text: "Обсудим сроки поставки, запуск, обучение и дальнейшую поддержку оборудования.",
  },
];

const buildWhatsappHref = (messenger: string) => {
  const digits = messenger.replace(/[^\d]/g, "");
  return digits ? `https://wa.me/${digits}` : undefined;
};

const ContactsReaLabPage = () => {
  const { data } = useGetContactInfoQuery();
  const contacts = data ?? [];

  return (
    <section className={scss.page}>
      <div className="container">
        <div className={scss.hero}>
          <div className={scss.heroCopy}>
            <span className={scss.eyebrow}>PROCUREMENT DESK</span>
            <h1>Контакты ReaLab</h1>
            <p>
              Если нужно собрать коммерческое предложение, уточнить поставку или
              обсудить внедрение оборудования, команда ReaLab отвечает по делу и с
              учетом клинического контекста.
            </p>

            <div className={scss.heroActions}>
              <Link href="/catalog" className={scss.primaryAction}>
                Перейти в каталог
              </Link>
              <a href="mailto:hello@realab.kg" className={scss.secondaryAction}>
                Написать на email
              </a>
            </div>
          </div>

          <div className={scss.heroAside}>
            <h2>Когда к нам обычно обращаются</h2>
            <ul>
              <li>нужно быстро собрать подборку оборудования под отделение</li>
              <li>нужно уточнить доступные конфигурации и сроки поставки</li>
              <li>нужен procurement-ready пакет для согласования и тендера</li>
              <li>нужна консультация по сервису и запуску после поставки</li>
            </ul>
          </div>
        </div>

        {contacts.length ? (
          <div className={scss.contactGrid}>
            {contacts.map((item, index) => {
              const whatsappHref = buildWhatsappHref(item.messenger);

              return (
                <article key={`${item.email}-${index}`} className={scss.contactCard}>
                  <span className={scss.cardEyebrow}>Основной канал</span>

                  <div className={scss.contactBlock}>
                    <div className={scss.iconWrap}>
                      <FiMessageCircle />
                    </div>
                    <div>
                      <h3>WhatsApp / Messenger</h3>
                      {whatsappHref ? (
                        <a href={whatsappHref} target="_blank" rel="noreferrer">
                          {item.messenger}
                        </a>
                      ) : (
                        <p>{item.messenger}</p>
                      )}
                    </div>
                  </div>

                  <div className={scss.contactBlock}>
                    <div className={scss.iconWrap}>
                      <FiMail />
                    </div>
                    <div>
                      <h3>Email</h3>
                      <a href={`mailto:${item.email}`}>{item.email}</a>
                    </div>
                  </div>

                  <div className={scss.contactBlock}>
                    <div className={scss.iconWrap}>
                      <FiMapPin />
                    </div>
                    <div>
                      <h3>Адрес</h3>
                      <p>{item.address}</p>
                    </div>
                  </div>
                </article>
              );
            })}

            <aside className={scss.procurementCard}>
              <span className={scss.cardEyebrow}>B2B / Clinics</span>
              <h2>Нужен быстрый вход в закупочный диалог?</h2>
              <p>
                Напишите кратко, какое отделение или сценарий вас интересует, и мы
                вернемся с подборкой, КП или маршрутом следующего шага.
              </p>
              <Link href="/sale">
                Смотреть спецусловия <FiArrowRight />
              </Link>
            </aside>
          </div>
        ) : (
          <div className={scss.emptyState}>
            <span className={scss.cardEyebrow}>Контакты</span>
            <h2>Контактные данные скоро появятся</h2>
            <p>Страница уже готова, осталось опубликовать способы связи через админку.</p>
          </div>
        )}

        <section className={scss.supportSection}>
          <div className={scss.sectionHeader}>
            <span>Support Lanes</span>
            <h2>Чем именно помогает команда ReaLab</h2>
          </div>

          <div className={scss.supportGrid}>
            {supportLanes.map((item) => (
              <article key={item.title} className={scss.supportCard}>
                <div className={scss.supportIcon}>
                  <FiCheckCircle />
                </div>
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

export default ContactsReaLabPage;
