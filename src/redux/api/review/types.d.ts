export namespace REVIEW {
  type ReviewRequest = {
    author: number | number[];
    text: string;
    stars: number;
    clothes_review: number | number[];
    review_photo?: string;
  };

  type ReviewResponse = {
    author: number;
    text: string;
    review_photo: string;
    stars: number;
    clothes_review: number;
  };
}
