import { api as index } from "..";
import { REVIEW } from "./types";

const api = index.injectEndpoints({
  endpoints: (build) => ({
    postReview: build.mutation<REVIEW.ReviewResponse, REVIEW.ReviewRequest>({
      query: (data) => ({
        url: "/review_add/",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["auth"],
    }),
  }),
});
export const {
  usePostReviewMutation
} = api;
