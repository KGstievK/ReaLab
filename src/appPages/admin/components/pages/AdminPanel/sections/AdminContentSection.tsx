"use client";

import { ChangeEvent, MutableRefObject, RefObject } from "react";
import { FiPlus } from "react-icons/fi";
import { resolveMediaUrl } from "../../../../../../utils/media";
import scss from "../AdminPanel.module.scss";
import { formatDate } from "../AdminPanel.shared";
import {
  AboutBlockFormState,
  AboutPageFormState,
  HomeTitleFormState,
} from "../AdminPanel.types";

type AdminContentSectionProps = {
  contentProducts: AdminPaginatedResponse<AdminProduct>;
  sections: AdminCmsSection[];
  canManageContent: boolean;
  homeTitleForm: HomeTitleFormState;
  aboutPageForm: AboutPageFormState;
  isSavingHomeTitle: boolean;
  isSavingAboutPage: boolean;
  aboutUploadingHero: boolean;
  aboutUploadingBlockIndex: number | null;
  aboutHeroInputRef: RefObject<HTMLInputElement | null>;
  aboutBlockInputRefs: MutableRefObject<Array<HTMLInputElement | null>>;
  maxProductImageSizeMb: number;
  onHomeTitleFieldChange: (field: keyof HomeTitleFormState, value: string) => void;
  onHomeTitleSave: () => Promise<void> | void;
  onAboutPageFieldChange: (
    field: keyof Omit<AboutPageFormState, "blocks">,
    value: string,
  ) => void;
  onAboutBlockFieldChange: (
    index: number,
    field: keyof AboutBlockFormState,
    value: string,
  ) => void;
  onAddAboutBlock: () => void;
  onRemoveAboutBlock: (index: number) => void;
  onAboutPageSave: () => Promise<void> | void;
  onAboutHeroImageUpload: (event: ChangeEvent<HTMLInputElement>) => Promise<void> | void;
  onAboutBlockImageUpload: (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => Promise<void> | void;
};

export const AdminContentSection = ({
  contentProducts,
  sections,
  canManageContent,
  homeTitleForm,
  aboutPageForm,
  isSavingHomeTitle,
  isSavingAboutPage,
  aboutUploadingHero,
  aboutUploadingBlockIndex,
  aboutHeroInputRef,
  aboutBlockInputRefs,
  maxProductImageSizeMb,
  onHomeTitleFieldChange,
  onHomeTitleSave,
  onAboutPageFieldChange,
  onAboutBlockFieldChange,
  onAddAboutBlock,
  onRemoveAboutBlock,
  onAboutPageSave,
  onAboutHeroImageUpload,
  onAboutBlockImageUpload,
}: AdminContentSectionProps) => (
  <div className={scss.panel}>
    <h2>Контент</h2>
    <div className={scss.cards}>
      <article>
        <div className={scss.panelHead}>
          <h3>Главный баннер</h3>
          <button
            type="button"
            onClick={() => void onHomeTitleSave()}
            disabled={!canManageContent || isSavingHomeTitle}
          >
            {isSavingHomeTitle ? "Сохранение..." : "Сохранить баннер"}
          </button>
        </div>
        <div className={scss.fieldGrid}>
          <label className={scss.formField}>
            <span>Подзаголовок</span>
            <input
              value={homeTitleForm.made}
              onChange={(event) => onHomeTitleFieldChange("made", event.target.value)}
              placeholder="MADE IN KYRGYZSTAN"
            />
          </label>
          <label className={scss.formField}>
            <span>Заголовок</span>
            <input
              value={homeTitleForm.title}
              onChange={(event) => onHomeTitleFieldChange("title", event.target.value)}
              placeholder="Заголовок главного баннера"
            />
          </label>
        </div>
        <div className={scss.fieldGrid}>
          <label className={scss.formField}>
            <span>Товар 1</span>
            <select
              value={homeTitleForm.clothes1_id}
              onChange={(event) => onHomeTitleFieldChange("clothes1_id", event.target.value)}
            >
              <option value="">Выберите товар</option>
              {contentProducts.results.map((product) => (
                <option key={`home-title-1-${product.id}`} value={String(product.id)}>
                  #{product.id} {product.name}
                </option>
              ))}
            </select>
          </label>
          <label className={scss.formField}>
            <span>Товар 2</span>
            <select
              value={homeTitleForm.clothes2_id}
              onChange={(event) => onHomeTitleFieldChange("clothes2_id", event.target.value)}
            >
              <option value="">Выберите товар</option>
              {contentProducts.results.map((product) => (
                <option key={`home-title-2-${product.id}`} value={String(product.id)}>
                  #{product.id} {product.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className={scss.formField}>
          <span>Товар 3</span>
          <select
            value={homeTitleForm.clothes3_id}
            onChange={(event) => onHomeTitleFieldChange("clothes3_id", event.target.value)}
          >
            <option value="">Выберите товар</option>
            {contentProducts.results.map((product) => (
              <option key={`home-title-3-${product.id}`} value={String(product.id)}>
                #{product.id} {product.name}
              </option>
            ))}
          </select>
        </label>
      </article>
    </div>

    <article className={scss.contentEditor}>
      <div className={scss.panelHead}>
        <div>
          <h3>Страница «О нас»</h3>
          <p className={scss.panelNote}>
            Управление главным заголовком, логотипом и всеми блоками страницы.
          </p>
        </div>
        <div className={scss.rowActions}>
          <button
            type="button"
            className={scss.secondaryAction}
            onClick={onAddAboutBlock}
            disabled={!canManageContent}
          >
            <FiPlus />
            Добавить блок
          </button>
          <button
            type="button"
            onClick={() => void onAboutPageSave()}
            disabled={!canManageContent || isSavingAboutPage}
          >
            {isSavingAboutPage ? "Сохранение..." : "Сохранить страницу"}
          </button>
        </div>
      </div>

      <div className={scss.fieldGrid}>
        <label className={scss.formField}>
          <span>Подзаголовок</span>
          <input
            value={aboutPageForm.made}
            onChange={(event) => onAboutPageFieldChange("made", event.target.value)}
            placeholder="MADE IN KYRGYZSTAN"
          />
        </label>
        <label className={scss.formField}>
          <span>Главный заголовок</span>
          <input
            value={aboutPageForm.title}
            onChange={(event) => onAboutPageFieldChange("title", event.target.value)}
            placeholder="Мы олицетворяем элегантность и скромность"
          />
        </label>
      </div>

      <div className={scss.uploadBox}>
        <label className={scss.formField}>
          <span>Логотип / изображение hero</span>
          <input
            ref={aboutHeroInputRef}
            className={scss.visuallyHiddenInput}
            type="file"
            accept="image/*,.svg,.jpg,.jpeg,.png,.webp,.gif,.jfif,.avif"
            onChange={(event) => void onAboutHeroImageUpload(event)}
            disabled={!canManageContent || aboutUploadingHero}
          />
          <button
            type="button"
            className={scss.fileInput}
            onClick={() => aboutHeroInputRef.current?.click()}
            disabled={!canManageContent || aboutUploadingHero}
          >
            {aboutUploadingHero ? "Загрузка..." : "Выбрать файл"}
          </button>
        </label>
        <small>
          {aboutUploadingHero
            ? "Загрузка hero-изображения..."
            : `Загрузите изображение hero. Поддерживаются svg, jpg, jpeg, png, webp, gif, jfif, avif. Максимум ${maxProductImageSizeMb} МБ.`}
        </small>
      </div>

      {aboutPageForm.logo.trim() && (
        <div className={scss.mediaPreview}>
          <img src={resolveMediaUrl(aboutPageForm.logo)} alt="Превью логотипа О нас" />
        </div>
      )}

      <div className={scss.aboutBlocks}>
        {aboutPageForm.blocks.map((block, index) => (
          <article key={`about-block-${index}`} className={scss.aboutBlockCard}>
            <div className={scss.panelHead}>
              <h3>Блок {index + 1}</h3>
              <button
                type="button"
                className={scss.secondaryAction}
                onClick={() => onRemoveAboutBlock(index)}
                disabled={!canManageContent || aboutPageForm.blocks.length <= 1}
              >
                Удалить
              </button>
            </div>

            <div className={scss.fieldGrid}>
              <label className={scss.formField}>
                <span>Заголовок блока</span>
                <input
                  value={block.title}
                  onChange={(event) =>
                    onAboutBlockFieldChange(index, "title", event.target.value)
                  }
                  placeholder="О бренде"
                />
              </label>
              <label className={scss.formField}>
                <span>Порядок</span>
                <input
                  type="number"
                  min={1}
                  value={block.sort_order}
                  onChange={(event) =>
                    onAboutBlockFieldChange(index, "sort_order", event.target.value)
                  }
                />
              </label>
            </div>

            <div className={scss.uploadBox}>
              <label className={scss.formField}>
                <span>Загрузка фото блока</span>
                <input
                  ref={(node) => {
                    aboutBlockInputRefs.current[index] = node;
                  }}
                  className={scss.visuallyHiddenInput}
                  type="file"
                  accept="image/*,.svg,.jpg,.jpeg,.png,.webp,.gif,.jfif,.avif"
                  onChange={(event) => void onAboutBlockImageUpload(index, event)}
                  disabled={!canManageContent || aboutUploadingBlockIndex === index}
                />
                <button
                  type="button"
                  className={scss.fileInput}
                  onClick={() => aboutBlockInputRefs.current[index]?.click()}
                  disabled={!canManageContent || aboutUploadingBlockIndex === index}
                >
                  {aboutUploadingBlockIndex === index ? "Загрузка..." : "Выбрать файл"}
                </button>
              </label>
              <small>
                {aboutUploadingBlockIndex === index
                  ? "Загрузка изображения..."
                  : `Загрузите изображение блока. Поддерживаются svg, jpg, jpeg, png, webp, gif, jfif, avif. Максимум ${maxProductImageSizeMb} МБ.`}
              </small>
            </div>

            {block.img.trim() && (
              <div className={scss.mediaPreview}>
                <img
                  src={resolveMediaUrl(block.img)}
                  alt={`Превью блока ${index + 1}`}
                />
              </div>
            )}

            <label className={scss.formField}>
              <span>Текст блока</span>
              <textarea
                value={block.text}
                onChange={(event) => onAboutBlockFieldChange(index, "text", event.target.value)}
                placeholder="Описание блока"
              />
            </label>
          </article>
        ))}
      </div>
    </article>

    <div className={scss.cards}>
      {sections.map((item) => (
        <article key={item.id}>
          <h3>{item.section_name}</h3>
          <p>Код: {item.section_code}</p>
          <p>Блоков: {item.blocks.length}</p>
          <p>Обновлено: {formatDate(item.updated_at)}</p>
        </article>
      ))}
    </div>
  </div>
);
