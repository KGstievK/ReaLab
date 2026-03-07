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
        <h1>{"\u041b\u0438\u0447\u043d\u044b\u0435 \u0434\u0430\u043d\u043d\u044b\u0435"}</h1>
        <p className={scss.subtitle}>
          {
            "\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u0441\u0432\u043e\u044e \u043b\u0438\u0447\u043d\u043e\u0441\u0442\u044c"
          }
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={scss.avatarBlock}>
            <div className={scss.avatarBox}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={"\u0410\u0432\u0430\u0442\u0430\u0440"} />
              ) : (
                <span>{initials}</span>
              )}

              <button
                type="button"
                className={scss.removeAvatarButton}
                aria-label={"\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0444\u043e\u0442\u043e"}
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
                  ? "\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u0444\u043e\u0442\u043e"
                  : "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0444\u043e\u0442\u043e"}
              </button>

              <p className={scss.avatarHint}>
                {
                  "\u0420\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0443\u0435\u043c \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u044c \u0444\u043e\u0440\u043c\u0430\u0442 300 x 300 \u0438 \u0440\u0430\u0437\u043c\u0435\u0440\u043e\u043c \u043d\u0435 \u0431\u043e\u043b\u0435\u0435 2 \u043c\u0431"
                }
              </p>
            </div>
          </div>

          <label className={scss.field}>
            <span>{"\u0418\u043c\u044f \u0438 \u0424\u0430\u043c\u0438\u043b\u0438\u044f"}</span>
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
                  "\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0438\u043c\u044f \u0438 \u0444\u0430\u043c\u0438\u043b\u0438\u044e"
                }
                onClick={() => enableField("fullName")}
              >
                <FiEdit2 />
              </button>
            </div>
          </label>

          <label className={scss.field}>
            <span>{"\u041d\u043e\u043c\u0435\u0440 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0430"}</span>
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
                  "\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u043d\u043e\u043c\u0435\u0440 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0430"
                }
                onClick={() => enableField("phone")}
              >
                <FiEdit2 />
              </button>
            </div>
          </label>

          <label className={scss.field}>
            <span>{"\u0410\u0434\u0440\u0435\u0441\u0441"}</span>
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
                  "\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0430\u0434\u0440\u0435\u0441"
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
                aria-label={"\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c email"}
                onClick={() => enableField("email")}
              >
                <FiEdit2 />
              </button>
            </div>
          </label>

          <label className={scss.field}>
            <span>{"\u041f\u0430\u0440\u043e\u043b\u044c"}</span>
            <div className={scss.inputWrap}>
              <input type="password" value="*********" readOnly />
              <button
                type="button"
                className={scss.editButton}
                aria-label={"\u0421\u043c\u0435\u043d\u0438\u0442\u044c \u043f\u0430\u0440\u043e\u043b\u044c"}
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
              ? "\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u0438\u0435..."
              : "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c"}
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
