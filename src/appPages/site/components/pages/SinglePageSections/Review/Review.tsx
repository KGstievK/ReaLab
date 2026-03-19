"use client";

import Link from "next/link";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useParams, usePathname } from "next/navigation";
import { FaRegStar, FaStar } from "react-icons/fa6";
import { FiImage, FiX } from "react-icons/fi";
import { usePostReviewMutation } from "../../../../../../redux/api/review";
import { REVIEW } from "../../../../../../redux/api/review/types";
import { useGetMeQuery } from "../../../../../../redux/api/auth";
import { useGetClothesByIdQuery } from "../../../../../../redux/api/category";
import UploadFileModal from "./UploadFileModal";
import scss from "./Review.module.scss";
import { resolveMediaUrl } from "@/utils/media";

const ratingOptions = [
  { value: 1, label: "Плохо" },
  { value: 2, label: "Слабо" },
  { value: 3, label: "Нормально" },
  { value: 4, label: "Хорошо" },
  { value: 5, label: "Отлично" },
];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const normalizePhotos = (rawValue: unknown): string[] => {
  if (!rawValue) {
    return [];
  }

  if (Array.isArray(rawValue)) {
    return rawValue
      .map((item) => (typeof item === "string" ? resolveMediaUrl(item.trim()) : ""))
      .filter(Boolean);
  }

  if (typeof rawValue !== "string") {
    return [];
  }

  const value = rawValue.trim();
  if (!value) {
    return [];
  }

  if (value.startsWith("[")) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === "string" ? resolveMediaUrl(item.trim()) : ""))
          .filter(Boolean);
      }
    } catch {
      return [resolveMediaUrl(value)];
    }
  }

  if (value.includes(",")) {
    return value
      .split(",")
      .map((item) => resolveMediaUrl(item.trim()))
      .filter(Boolean);
  }

  return [resolveMediaUrl(value)];
};

const Review = () => {
  const id = useParams<{ single: string }>();
  const pathname = usePathname();
  const { data: userResponse, status } = useGetMeQuery();
  const { data: clothesResponse, refetch } = useGetClothesByIdQuery(
    Number(id.single),
  );
  const { register, handleSubmit, reset } = useForm<REVIEW.ReviewRequest>();
  const [rating, setRating] = useState(0);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [reviewPhoto, setReviewPhoto] = useState<string | null>(null);
  const [postReviewMutation] = usePostReviewMutation();

  const safePathname = pathname && pathname.startsWith("/") ? pathname : "/";
  const signInHref = `/auth/sign-in?next=${encodeURIComponent(safePathname)}&from=${encodeURIComponent(safePathname)}`;

  const onSubmit: SubmitHandler<REVIEW.ReviewRequest> = async (reviewData) => {
    if (!userResponse?.length || !clothesResponse?.id || rating === 0) {
      return;
    }

    const payload: REVIEW.ReviewRequest = {
      author: userResponse[0].id,
      text: reviewData.text,
      stars: rating,
      clothes_review: clothesResponse.id,
      review_photo: reviewPhoto || undefined,
    };

    try {
      await postReviewMutation(payload).unwrap();
      reset();
      setRating(0);
      setReviewPhoto(null);
      refetch();
    } catch (error) {
      console.error("Review submit failed:", error);
    }
  };

  const reviewList = clothesResponse?.clothes_review ?? [];

  return (
    <section className={scss.reviewSection}>
      <div className={scss.content}>
        <h2>Отзывы</h2>

        <div className={scss.reviewGrid}>
          <div className={scss.reviewFormBlock}>
            <h3>Оставить отзыв</h3>
            <p>Поделитесь впечатлением о модели, ткани и посадке, чтобы помочь другим покупателям.</p>

            {status === "fulfilled" ? (
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className={scss.ratingRow}>
                  {ratingOptions.map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      className={scss.ratingItem}
                      onClick={() => setRating(option.value)}
                    >
                      {rating >= option.value ? (
                        <FaStar className={scss.activeStar} />
                      ) : (
                        <FaRegStar className={scss.passiveStar} />
                      )}
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  {...register("text")}
                  placeholder="Напишите, как модель ощущается в носке, как сидит и какой размер вы выбрали"
                />

                {reviewPhoto && (
                  <div className={scss.previewPhoto}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={reviewPhoto} alt="Предпросмотр отзыва" />
                    <button type="button" onClick={() => setReviewPhoto(null)}>
                      <FiX />
                    </button>
                  </div>
                )}

                <div className={scss.attachRow}>
                  <div className={scss.attachInfo}>
                    <div className={scss.attachIcon}>
                      <FiImage />
                    </div>
                    <div className={scss.attachText}>
                      <h4>Прикрепите фото</h4>
                      <p>Можно добавить изображение изделия или посадки. Поддерживаются jpg, gif и png.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={scss.chooseButton}
                    onClick={() => setIsUploadModalOpen(true)}
                  >
                    Выбрать
                  </button>
                </div>

                <button type="submit" className={scss.submitButton}>
                  Отправить отзыв
                </button>
              </form>
            ) : (
              <div className={scss.loginBlock}>
                <p>Чтобы оставить отзыв, выполните вход в аккаунт.</p>
                <Link href={signInHref}>Войти</Link>
              </div>
            )}
          </div>

          <div className={scss.reviewComments}>
            {reviewList.length === 0 ? (
              <div className={scss.emptyState}>
                Пока нет отзывов. Вы можете стать первым покупателем, который поделится впечатлением.
              </div>
            ) : (
              reviewList.map((item, idx) => {
                const photos = normalizePhotos(item.review_photo).slice(0, 2);
                const authorName = item.author.first_name || "Покупатель";

                return (
                  <article
                    key={`${authorName}-${idx}`}
                    className={scss.commentCard}
                  >
                    <div className={scss.commentTop}>
                      <div className={scss.author}>
                        <div className={scss.avatar}>{authorName.charAt(0)}</div>
                        <div className={scss.authorInfo}>
                          <h4>{authorName}</h4>
                          <p>{formatDate(item.created_date)}</p>
                        </div>
                      </div>

                      <div className={scss.score}>
                        <FaStar />
                        {item.stars}
                      </div>
                    </div>

                    <p className={scss.commentText}>{item.text}</p>

                    {photos.length > 0 && (
                      <div className={scss.commentPhotos}>
                        {photos.map((photo, photoIndex) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={`${photo}-${photoIndex}`}
                            src={photo}
                            alt="Фото к отзыву"
                          />
                        ))}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>

      <UploadFileModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onApply={setReviewPhoto}
      />
    </section>
  );
};

export default Review;
