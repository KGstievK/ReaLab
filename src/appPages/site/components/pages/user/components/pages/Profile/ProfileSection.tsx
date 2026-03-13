"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import {
  useDeleteProfileAddressMutation,
  useGetMeQuery,
  useGetProfileAddressesQuery,
  usePatchProfileAddressMutation,
  usePostProfileAddressMutation,
  usePutMeMutation,
  useSetDefaultProfileAddressMutation,
} from "../../../../../../../../redux/api/auth";
import AvatarCropModal from "./avatarCropModal/AvatarCropModal";
import scss from "./ProfileSection.module.scss";

type EditableField = "fullName" | "phone" | "address" | "email";

type ProfileFormValues = {
  fullName: string;
  phone: string;
  address: string;
  email: string;
};

type AddressFormValues = {
  label: string;
  recipient_name: string;
  phone_number: string;
  country: string;
  city: string;
  address: string;
  postal_code: string;
  is_default: boolean;
};

const EDITABLE_DEFAULT: Record<EditableField, boolean> = {
  fullName: false,
  phone: false,
  address: false,
  email: false,
};

const EMPTY_ADDRESS_FORM: AddressFormValues = {
  label: "",
  recipient_name: "",
  phone_number: "",
  country: "Kyrgyzstan",
  city: "",
  address: "",
  postal_code: "",
  is_default: false,
};

const ProfileSection: FC = () => {
  const router = useRouter();
  const { data: response } = useGetMeQuery();
  const [putMe, { isLoading: isSaving }] = usePutMeMutation();
  const [editable, setEditable] =
    useState<Record<EditableField, boolean>>(EDITABLE_DEFAULT);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addressForm, setAddressForm] =
    useState<AddressFormValues>(EMPTY_ADDRESS_FORM);
  const [addressError, setAddressError] = useState<string | null>(null);

  const { register, handleSubmit, reset, setFocus, formState } =
    useForm<ProfileFormValues>({
      mode: "onChange",
      defaultValues: {
        fullName: "",
        phone: "",
        address: "",
        email: "",
      },
    });

  const user = useMemo(() => {
    if (!Array.isArray(response) || response.length === 0) {
      return undefined;
    }

    return response[0];
  }, [response]);

  const { data: profileAddresses = [] } = useGetProfileAddressesQuery(undefined, {
    skip: !user,
  });

  const [postProfileAddress, { isLoading: isCreatingAddress }] =
    usePostProfileAddressMutation();
  const [patchProfileAddress, { isLoading: isUpdatingAddress }] =
    usePatchProfileAddressMutation();
  const [deleteProfileAddress, { isLoading: isDeletingAddress }] =
    useDeleteProfileAddressMutation();
  const [setDefaultProfileAddress, { isLoading: isSettingDefaultAddress }] =
    useSetDefaultProfileAddressMutation();

  const addresses = profileAddresses.length > 0 ? profileAddresses : user?.addresses ?? [];
  const defaultAddress =
    user?.default_address ?? addresses.find((item) => item.is_default) ?? null;

  useEffect(() => {
    if (!user) {
      return;
    }

    reset({
      fullName: [user.first_name, user.last_name].filter(Boolean).join(" ").trim(),
      phone: defaultAddress?.phone_number || user.number || "",
      address: defaultAddress?.address || user.address || "",
      email: user.email || "",
    });
    setEditable(EDITABLE_DEFAULT);
  }, [defaultAddress?.address, defaultAddress?.phone_number, reset, user]);

  useEffect(() => {
    const savedAvatar = localStorage.getItem("jumana_profile_avatar");
    if (savedAvatar) {
      setAvatarUrl(savedAvatar);
    }
  }, []);

  useEffect(() => {
    if (avatarUrl) {
      localStorage.setItem("jumana_profile_avatar", avatarUrl);
      return;
    }

    localStorage.removeItem("jumana_profile_avatar");
  }, [avatarUrl]);

  const initials = useMemo(() => {
    if (!user) {
      return "J";
    }

    const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();

    if (!name) {
      return "J";
    }

    return name
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 2);
  }, [user]);

  const hasChanges =
    formState.isDirty && Object.keys(formState.dirtyFields).length > 0;
  const canSave = Boolean(user && hasChanges && !isSaving);
  const isAddressBusy =
    isCreatingAddress ||
    isUpdatingAddress ||
    isDeletingAddress ||
    isSettingDefaultAddress;

  const enableField = (field: EditableField) => {
    setEditable((prev) => ({ ...prev, [field]: true }));
    setTimeout(() => {
      setFocus(field);
    }, 0);
  };

  const resetAddressEditor = () => {
    setEditingAddressId(null);
    setAddressError(null);
    setAddressForm({
      ...EMPTY_ADDRESS_FORM,
      recipient_name:
        [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() || "",
      phone_number: user?.number || defaultAddress?.phone_number || "",
      city: defaultAddress?.city || "",
      address: defaultAddress?.address || user?.address || "",
      is_default: addresses.length === 0,
    });
  };

  const startEditAddress = (address: AUTH.ProfileAddress) => {
    setEditingAddressId(address.id);
    setAddressError(null);
    setAddressForm({
      label: address.label || "",
      recipient_name: address.recipient_name || "",
      phone_number: address.phone_number || "",
      country: address.country || "Kyrgyzstan",
      city: address.city || "",
      address: address.address || "",
      postal_code: address.postal_code || "",
      is_default: address.is_default,
    });
  };

  useEffect(() => {
    if (!editingAddressId && !addressForm.recipient_name && user) {
      resetAddressEditor();
    }
  }, [editingAddressId, user]);

  const onSubmit: SubmitHandler<ProfileFormValues> = async (formValues) => {
    if (!user || !canSave) {
      return;
    }

    const [first_name, ...rest] = formValues.fullName.trim().split(/\s+/);
    const last_name = rest.join(" ");

    try {
      await putMe({
        id: user.id,
        username: user.username,
        first_name: first_name || user.first_name || "",
        last_name: last_name || user.last_name || "",
        email: formValues.email.trim(),
        address: formValues.address.trim(),
        number: formValues.phone.trim(),
      }).unwrap();

      reset(formValues);
      setEditable(EDITABLE_DEFAULT);
    } catch (error) {
      console.error("Profile update failed:", error);
    }
  };

  const handleAddressFieldChange =
    (field: keyof AddressFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value;

      setAddressForm((prev) => ({
        ...prev,
        [field]: value,
      }));
      setAddressError(null);
    };

  const handleAddressSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!addressForm.recipient_name.trim()) {
      setAddressError("Укажите получателя.");
      return;
    }
    if (!addressForm.phone_number.trim()) {
      setAddressError("Укажите номер телефона.");
      return;
    }
    if (!addressForm.city.trim()) {
      setAddressError("Укажите город.");
      return;
    }
    if (!addressForm.address.trim()) {
      setAddressError("Укажите адрес.");
      return;
    }

    const payload = {
      label: addressForm.label.trim(),
      recipient_name: addressForm.recipient_name.trim(),
      phone_number: addressForm.phone_number.trim(),
      country: addressForm.country.trim() || "Kyrgyzstan",
      city: addressForm.city.trim(),
      address: addressForm.address.trim(),
      postal_code: addressForm.postal_code.trim(),
      is_default: addressForm.is_default,
    };

    try {
      if (editingAddressId) {
        await patchProfileAddress({ id: editingAddressId, ...payload }).unwrap();
      } else {
        await postProfileAddress(payload).unwrap();
      }

      resetAddressEditor();
    } catch (error) {
      console.error("Address save failed:", error);
      setAddressError("Не удалось сохранить адрес.");
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!window.confirm("Удалить этот адрес?")) {
      return;
    }

    try {
      await deleteProfileAddress({ id }).unwrap();
      if (editingAddressId === id) {
        resetAddressEditor();
      }
    } catch (error) {
      console.error("Address delete failed:", error);
      setAddressError("Не удалось удалить адрес.");
    }
  };

  const handleSetDefaultAddress = async (id: number) => {
    try {
      await setDefaultProfileAddress({ id }).unwrap();
    } catch (error) {
      console.error("Set default address failed:", error);
      setAddressError("Не удалось обновить адрес по умолчанию.");
    }
  };

  if (!user) {
    return null;
  }

  return (
    <section className={scss.ProfileSection}>
      <div className={scss.content}>
        <h1>Личные данные</h1>
        <p className={scss.subtitle}>Подтвердите свою личность</p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={scss.avatarBlock}>
            <div className={scss.avatarBox}>
              {avatarUrl ? <img src={avatarUrl} alt="Аватар" /> : <span>{initials}</span>}

              <button
                type="button"
                className={scss.removeAvatarButton}
                aria-label="Удалить фото"
                onClick={() => setAvatarUrl(null)}
              >
                <FiTrash2 />
              </button>
            </div>

            <div className={scss.avatarMeta}>
              <button
                type="button"
                className={scss.avatarUploadButton}
                onClick={() => setIsAvatarModalOpen(true)}
              >
                {avatarUrl ? "Изменить фото" : "Загрузить фото"}
              </button>

              <p className={scss.avatarHint}>
                Рекомендуем использовать формат 300 x 300 и размером не более 2 мб
              </p>
            </div>
          </div>

          <label className={scss.field}>
            <span>Имя и фамилия</span>
            <div className={scss.inputWrap}>
              <input
                type="text"
                readOnly={!editable.fullName}
                className={editable.fullName ? scss.editable : ""}
                {...register("fullName")}
              />
              <button
                type="button"
                className={scss.editButton}
                aria-label="Редактировать имя и фамилию"
                onClick={() => enableField("fullName")}
              >
                <FiEdit2 />
              </button>
            </div>
          </label>

          <label className={scss.field}>
            <span>Номер телефона</span>
            <div className={scss.inputWrap}>
              <input
                type="text"
                readOnly={!editable.phone}
                className={editable.phone ? scss.editable : ""}
                {...register("phone")}
              />
              <button
                type="button"
                className={scss.editButton}
                aria-label="Редактировать номер телефона"
                onClick={() => enableField("phone")}
              >
                <FiEdit2 />
              </button>
            </div>
          </label>

          <label className={scss.field}>
            <span>Адрес</span>
            <div className={scss.inputWrap}>
              <input
                type="text"
                readOnly={!editable.address}
                className={editable.address ? scss.editable : ""}
                {...register("address")}
              />
              <button
                type="button"
                className={scss.editButton}
                aria-label="Редактировать адрес"
                onClick={() => enableField("address")}
              >
                <FiEdit2 />
              </button>
            </div>
          </label>

          <label className={scss.field}>
            <span>Email</span>
            <div className={scss.inputWrap}>
              <input
                type="text"
                readOnly={!editable.email}
                className={editable.email ? scss.editable : ""}
                {...register("email")}
              />
              <button
                type="button"
                className={scss.editButton}
                aria-label="Редактировать email"
                onClick={() => enableField("email")}
              >
                <FiEdit2 />
              </button>
            </div>
          </label>

          <label className={scss.field}>
            <span>Пароль</span>
            <div className={scss.inputWrap}>
              <input type="password" value="*********" readOnly />
              <button
                type="button"
                className={scss.editButton}
                aria-label="Сменить пароль"
                onClick={() => router.push("/auth/forgot")}
              >
                <FiEdit2 />
              </button>
            </div>
          </label>

          <button
            className={`${scss.submit} ${canSave ? scss.active : ""}`}
            type="submit"
            disabled={!canSave}
          >
            {isSaving ? "Сохранение..." : "Сохранить"}
          </button>
        </form>

        {(defaultAddress?.address || user.address || user.number) && (
          <div className={scss.savedAddress}>
            <h3>Адрес по умолчанию для оформления</h3>
            <p>
              {defaultAddress?.recipient_name ||
                [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
                "—"}
            </p>
            <p>{defaultAddress?.phone_number || user.number || "—"}</p>
            <p>
              {[defaultAddress?.city, defaultAddress?.address || user.address]
                .filter(Boolean)
                .join(", ") || "—"}
            </p>
          </div>
        )}

        <section className={scss.addressBook}>
          <div className={scss.addressBookHeader}>
            <div>
              <h2>Сохранённые адреса</h2>
              <p>Используйте их для быстрого оформления заказа.</p>
            </div>
            <button type="button" className={scss.secondaryButton} onClick={resetAddressEditor}>
              Новый адрес
            </button>
          </div>

          <div className={scss.addressList}>
            {addresses.length === 0 ? (
              <div className={scss.addressEmpty}>
                У вас пока нет сохранённых адресов.
              </div>
            ) : (
              addresses.map((address) => (
                <article key={address.id} className={scss.addressCard}>
                  <div className={scss.addressCardHead}>
                    <div>
                      <h3>{address.label || "Адрес"}</h3>
                      {address.is_default && <span className={scss.defaultBadge}>По умолчанию</span>}
                    </div>
                    <div className={scss.addressActions}>
                      {!address.is_default && (
                        <button
                          type="button"
                          className={scss.linkButton}
                          onClick={() => handleSetDefaultAddress(address.id)}
                          disabled={isAddressBusy}
                        >
                          Сделать основным
                        </button>
                      )}
                      <button
                        type="button"
                        className={scss.iconButton}
                        onClick={() => startEditAddress(address)}
                        aria-label="Редактировать адрес"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        className={scss.iconButton}
                        onClick={() => handleDeleteAddress(address.id)}
                        aria-label="Удалить адрес"
                        disabled={isAddressBusy}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>

                  <p>{address.recipient_name}</p>
                  <p>{address.phone_number}</p>
                  <p>{[address.city, address.address].filter(Boolean).join(", ")}</p>
                </article>
              ))
            )}
          </div>

          <form className={scss.addressForm} onSubmit={handleAddressSubmit}>
            <div className={scss.addressFormHeader}>
              <h3>{editingAddressId ? "Редактировать адрес" : "Добавить адрес"}</h3>
              {editingAddressId && (
                <button type="button" className={scss.linkButton} onClick={resetAddressEditor}>
                  Отменить
                </button>
              )}
            </div>

            <div className={scss.addressGrid}>
              <label className={scss.field}>
                <span>Название</span>
                <input
                  type="text"
                  value={addressForm.label}
                  onChange={handleAddressFieldChange("label")}
                  placeholder="Например, Дом"
                />
              </label>

              <label className={scss.field}>
                <span>Получатель</span>
                <input
                  type="text"
                  value={addressForm.recipient_name}
                  onChange={handleAddressFieldChange("recipient_name")}
                  placeholder="Айгерим"
                />
              </label>

              <label className={scss.field}>
                <span>Телефон</span>
                <input
                  type="text"
                  value={addressForm.phone_number}
                  onChange={handleAddressFieldChange("phone_number")}
                  placeholder="+996 555 000 000"
                />
              </label>

              <label className={scss.field}>
                <span>Страна</span>
                <input
                  type="text"
                  value={addressForm.country}
                  onChange={handleAddressFieldChange("country")}
                  placeholder="Kyrgyzstan"
                />
              </label>

              <label className={scss.field}>
                <span>Город</span>
                <input
                  type="text"
                  value={addressForm.city}
                  onChange={handleAddressFieldChange("city")}
                  placeholder="Бишкек"
                />
              </label>

              <label className={scss.field}>
                <span>Почтовый индекс</span>
                <input
                  type="text"
                  value={addressForm.postal_code}
                  onChange={handleAddressFieldChange("postal_code")}
                  placeholder="720000"
                />
              </label>

              <label className={`${scss.field} ${scss.fullWidth}`}>
                <span>Адрес</span>
                <input
                  type="text"
                  value={addressForm.address}
                  onChange={handleAddressFieldChange("address")}
                  placeholder="Улица, дом, квартира"
                />
              </label>
            </div>

            <label className={scss.checkboxRow}>
              <input
                type="checkbox"
                checked={addressForm.is_default}
                onChange={handleAddressFieldChange("is_default")}
              />
              <span>Сделать адресом по умолчанию</span>
            </label>

            {addressError && <p className={scss.addressError}>{addressError}</p>}

            <button type="submit" className={scss.secondarySubmit} disabled={isAddressBusy}>
              {isAddressBusy
                ? "Сохранение..."
                : editingAddressId
                  ? "Сохранить адрес"
                  : "Добавить адрес"}
            </button>
          </form>
        </section>
      </div>

      <AvatarCropModal
        isOpen={isAvatarModalOpen}
        initialImage={avatarUrl}
        onClose={() => setIsAvatarModalOpen(false)}
        onApply={(dataUrl) => setAvatarUrl(dataUrl)}
      />
    </section>
  );
};

export default ProfileSection;
