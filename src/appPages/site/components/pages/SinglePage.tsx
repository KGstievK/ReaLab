"use client";

import { useGetClothesByIdQuery } from "../../../../redux/api/category";
import { useParams } from "next/navigation";
import SinglePageSection from "./SinglePageSections/SinglePageSection";

const SinglePage = () => {
  const { single } = useParams<{ single: string }>();
  console.log("id", single);

  if (!single) {
    return <div>Loading...</div>;
  }

  // const { data } = useGetClothesByIdQuery(single)
  // console.log(data)
  return (
    <div>
      <SinglePageSection />
    </div>
  );
};

export default SinglePage;
