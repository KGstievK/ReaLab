"use client";

import { ChangeEvent, RefObject } from "react";
import { FiX } from "react-icons/fi";
import { resolveMediaUrl } from "../../../../../../utils/media";
import scss from "../AdminPanel.module.scss";
import { ProductFormState, ProductModalMode } from "../AdminPanel.types";

type AdminProductModalProps = {
  isOpen: boolean;
  productModalMode: ProductModalMode;
  selectedProduct: AdminProduct | null;
  categories: AdminCategory[];
  defaultCategoryId: number;
  productForm: ProductFormState;
  productImagePreviews: string[];
  productImageInputRef: RefObject<HTMLInputElement | null>;
  canManageProducts: boolean;
  canDeleteProducts: boolean;
  isProductMutationLoading: boolean;
  isDeletingProduct: boolean;
  isSavingProduct: boolean;
  onClose: () => void;
  onDelete: () => Promise<void> | void;
  onSave: () => Promise<void> | void;
  onFieldChange: (field: keyof ProductFormState, value: string | boolean) => void;
  onImageFilesChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export const AdminProductModal = ({
  isOpen,
  productModalMode,
  selectedProduct,
  categories,
  defaultCategoryId,
  productForm,
  productImagePreviews,
  productImageInputRef,
  canManageProducts,
  canDeleteProducts,
  isProductMutationLoading,
  isDeletingProduct,
  isSavingProduct,
  onClose,
  onDelete,
  onSave,
  onFieldChange,
  onImageFilesChange,
}: AdminProductModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={scss.modalOverlay}
      onClick={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <div className={scss.modal}>
        <div className={scss.modalHeader}>
          <h3>
            {productModalMode === "create"
              ? "Создать товар"
              : productModalMode === "edit"
                ? `Редактировать товар #${selectedProduct?.id ?? ""}`
                : `Удалить товар #${selectedProduct?.id ?? ""}`}
          </h3>
          <button
            type="button"
            className={scss.closeButton}
            onClick={onClose}
            aria-label="Закрыть окно"
            disabled={isProductMutationLoading}
          >
            <FiX />
          </button>
        </div>

        {productModalMode === "delete" ? (
          <div className={scss.deleteBox}>
            <p>
              Вы действительно хотите удалить
              <strong> {selectedProduct?.name}</strong>?
            </p>
            <div className={scss.modalActions}>
              <button
                type="button"
                className={scss.secondary}
                onClick={onClose}
                disabled={isProductMutationLoading}
              >
                Отмена
              </button>
              <button
                type="button"
                className={scss.danger}
                onClick={() => void onDelete()}
                disabled={!canDeleteProducts || isDeletingProduct}
              >
                {isDeletingProduct ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={scss.modalBody}>
              <label className={scss.formField}>
                <span>Название</span>
                <input
                  value={productForm.name}
                  onChange={(event) => onFieldChange("name", event.target.value)}
                  placeholder="Название товара"
                />
              </label>

              <label className={scss.formField}>
                <span>Описание</span>
                <textarea
                  value={productForm.description}
                  onChange={(event) => onFieldChange("description", event.target.value)}
                  rows={4}
                  placeholder="Краткое описание товара"
                />
              </label>

              <div className={scss.fieldGrid}>
                <label className={scss.formField}>
                  <span>Категория</span>
                  <select
                    value={productForm.category_id}
                    onChange={(event) => onFieldChange("category_id", event.target.value)}
                  >
                    {categories.length ? (
                      categories.map((category) => (
                        <option key={category.id} value={String(category.id)}>
                          {category.category_name}
                        </option>
                      ))
                    ) : (
                      <option value={String(defaultCategoryId)}>Категории не загружены</option>
                    )}
                  </select>
                </label>

                <label className={scss.formField}>
                  <span>Ткань</span>
                  <input
                    value={productForm.textile_name}
                    onChange={(event) => onFieldChange("textile_name", event.target.value)}
                    placeholder="Например: Тафта"
                  />
                </label>
              </div>

              <div className={scss.fieldGrid}>
                <label className={scss.formField}>
                  <span>Базовая цена</span>
                  <input
                    type="number"
                    min={1}
                    value={productForm.base_price}
                    onChange={(event) => onFieldChange("base_price", event.target.value)}
                  />
                </label>

                <label className={scss.formField}>
                  <span>Себестоимость</span>
                  <input
                    type="number"
                    min={0}
                    value={productForm.cost_price}
                    onChange={(event) => onFieldChange("cost_price", event.target.value)}
                    placeholder="Используется для расчета прибыли"
                  />
                </label>

                <label className={scss.formField}>
                  <span>Цена со скидкой</span>
                  <input
                    type="number"
                    min={0}
                    value={productForm.discount_price}
                    onChange={(event) => onFieldChange("discount_price", event.target.value)}
                    placeholder="Необязательно"
                  />
                </label>
              </div>

              <div className={scss.fieldGrid}>
                <label className={scss.formField}>
                  <span>Размеры через запятую</span>
                  <input
                    value={productForm.sizes}
                    onChange={(event) => onFieldChange("sizes", event.target.value)}
                    placeholder="S, M, L"
                  />
                </label>

                <label className={scss.formField}>
                  <span>Цвета через запятую</span>
                  <input
                    value={productForm.colors}
                    onChange={(event) => onFieldChange("colors", event.target.value)}
                    placeholder="Черный, Бежевый"
                  />
                </label>
              </div>

              <label className={scss.formField}>
                <span>Промо-категории через запятую</span>
                <input
                  value={productForm.promo_categories}
                  onChange={(event) => onFieldChange("promo_categories", event.target.value)}
                  placeholder="популярные, тренд"
                />
              </label>

              <div className={scss.uploadBox}>
                <label className={scss.formField}>
                  <span>Изображения товара</span>
                  <input
                    ref={productImageInputRef}
                    className={scss.visuallyHiddenInput}
                    type="file"
                    accept="image/*,.svg,.jpg,.jpeg,.png,.webp,.gif,.jfif,.avif"
                    multiple
                    onChange={onImageFilesChange}
                  />
                  <button
                    type="button"
                    className={scss.fileInput}
                    onClick={() => productImageInputRef.current?.click()}
                    disabled={!canManageProducts}
                  >
                    Выбрать файлы
                  </button>
                </label>
                <small>
                  Загрузите файлы, чтобы заменить текущие фото. До 10 изображений, максимум
                  7 МБ каждое.
                </small>
              </div>

              {productImagePreviews.length > 0 && (
                <div className={scss.previewGrid}>
                  {productImagePreviews.map((preview, index) => (
                    <div className={scss.previewItem} key={`${preview}-${index}`}>
                      <img src={preview} alt={`preview-${index + 1}`} />
                    </div>
                  ))}
                </div>
              )}

              {productModalMode === "edit" &&
                productImagePreviews.length === 0 &&
                (selectedProduct?.images?.length || 0) > 0 && (
                  <div className={scss.previewGrid}>
                    {selectedProduct?.images.map((image) => (
                      <div className={scss.previewItem} key={image.id}>
                        <img
                          src={resolveMediaUrl(image.photo)}
                          alt={image.color || "изображение товара"}
                        />
                      </div>
                    ))}
                  </div>
                )}

              <label className={scss.inlineCheck}>
                <input
                  type="checkbox"
                  checked={productForm.active}
                  onChange={(event) => onFieldChange("active", event.target.checked)}
                />
                <span>Опубликовать товар</span>
              </label>
            </div>

            <div className={scss.modalActions}>
              <button
                type="button"
                className={scss.secondary}
                onClick={onClose}
                disabled={isProductMutationLoading}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => void onSave()}
                disabled={!canManageProducts || isSavingProduct}
              >
                {isSavingProduct
                  ? "Сохранение..."
                  : productModalMode === "create"
                    ? "Создать"
                    : "Сохранить"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
