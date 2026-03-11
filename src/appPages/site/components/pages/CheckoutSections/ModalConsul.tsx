import { useState } from "react";
import scss from "./ModalConsul.module.scss";
import { IoCloseOutline } from "react-icons/io5";
import { IoIosCheckmarkCircle } from "react-icons/io";
import Image from "next/image";
import { useGetPayQuery } from "../../../../../redux/api/product";
import { resolveMediaUrl } from "@/utils/media";

interface ModalConsulProps {
  type: "form" | "success";
  onClose: (type?: "success" | null) => void;
}

interface Scanner {
  pay_img: string;
  info: string;
  number: string;
}

interface PayConfig {
  whatsapp: string;
  pay_title: Scanner[];
}

const ModalConsul: React.FC<ModalConsulProps> = ({ type, onClose }) => {
  const { data } = useGetPayQuery();
  const [imgError, setImgError] = useState<Record<number, boolean>>({});

  const payData: PayConfig | undefined = Array.isArray(data) ? data[0] : data;
  const isSuccess = type === "success";

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleImageError = (idx: number) => {
    setImgError((prev) => ({ ...prev, [idx]: true }));
  };

  return (
    <div className={scss.modal} onClick={handleOverlayClick}>
      <div className={scss.modalContent}>
        <p className={scss.close} onClick={() => onClose()}>
          <IoCloseOutline />
        </p>
        {isSuccess ? (
          <div className={scss.icon}>
            <div className={scss.icon1}>
              <h1>
                <IoIosCheckmarkCircle />
              </h1>
              <h2>Спасибо!</h2>
              <p>Ваша заявка успешно отправлена!</p>
            </div>
          </div>
        ) : (
          <div className={scss.window_modal}>
            <div className={scss.box}>
              {payData?.pay_title?.map((item, idx) => (
                <div key={idx} className={scss.block}>
                  <Image
                    width={300}
                    height={300}
                    src={imgError[idx] ? "/fallback-image.jpg" : resolveMediaUrl(item.pay_img)}
                    alt={`scanner-${idx}`}
                    onError={() => handleImageError(idx)}
                    priority
                  />
                  <h4 className={scss.title}>{item.number}</h4>
                  <p>{item.info}</p>
                </div>
              ))}
            </div>
            <a href={payData?.whatsapp || "#"} target="_blank" rel="noreferrer">
              <button className={scss.button}>Отправьте чек</button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalConsul;
