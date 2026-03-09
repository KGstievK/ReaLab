"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import {
  useGetMeQuery,
  usePutMeMutation,
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

const EDITABLE_DEFAULT: Record<EditableField, boolean> = {
  fullName: false,
  phone: false,
  address: false,
  email: false,
};

const ProfileSection: FC = () => {
  const router = useRouter();
  const { data: response } = useGetMeQuery();
  const [putMe, { isLoading: isSaving }] = usePutMeMutation();
  const [editable, setEditable] =
    useState<Record<EditableField, boolean>>(EDITABLE_DEFAULT);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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

  useEffect(() => {
    if (!user) {
      return;
    }

    reset({
      fullName: [user.first_name, user.last_name].filter(Boolean).join(" ").trim(),
      phone: user.number || "",
      address: user.address || "",
      email: user.email || "",
    });
    setEditable(EDITABLE_DEFAULT);
  }, [reset, user]);

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

  const enableField = (field: EditableField) => {
    setEditable((prev) => ({ ...prev, [field]: true }));
    setTimeout(() => {
      setFocus(field);
    }, 0);
  };

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

  if (!user) {
    return null;
  }

  return (
    <section className={scss.ProfileSection}>
      <div className={scss.content}>
        <h1>{"Личные данные"}</h1>
        <p className={scss.subtitle}>
          {
            "Подтвердите свою личность"
          }
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={scss.avatarBlock}>
            <div className={scss.avatarBox}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={"Аватар"} />
              ) : (
                <span>{initials}</span>
              )}

              <button
                type="button"
                className={scss.removeAvatarButton}
                aria-label={"Удалить фото"}
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
                {avatarUrl
                  ? "Изменить фото"
                  : "Загрузить фото"}
              </button>

              <p className={scss.avatarHint}>
                {
                  "Рекомендуем использовать формат 300 x 300 и размером не более 2 мб"
                }
              </p>
            </div>
          </div>

          <label className={scss.field}>
            <span>{"Имя и Фамилия"}</span>
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
                aria-label={
                  "Редактировать имя и фамилию"
                }
                onClick={() => enableField("fullName")}
              >
                <FiEdit2 />
              </button>
            </div>
          </label>

          <label className={scss.field}>
            <span>{"Номер телефона"}</span>
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
                aria-label={
                  "Редактировать номер телефона"
                }
                onClick={() => enableField("phone")}
              >
                <FiEdit2 />
              </button>
            </div>
          </label>

          <label className={scss.field}>
            <span>{"Адресс"}</span>
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
                aria-label={
                  "Редактировать адрес"
                }
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
                aria-label={"Редактировать email"}
                onClick={() => enableField("email")}
              >
                <FiEdit2 />
              </button>
            </div>
          </label>

          <label className={scss.field}>
            <span>{"Пароль"}</span>
            <div className={scss.inputWrap}>
              <input type="password" value="*********" readOnly />
              <button
                type="button"
                className={scss.editButton}
                aria-label={"Сменить пароль"}
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
            {isSaving
              ? "Сохранение..."
              : "Сохранить"}
          </button>
        </form>
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

