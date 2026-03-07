import {api as index} from '..'


const api = index.injectEndpoints({
  endpoints: (build) => ({
    getSlider: build.query({
      query: () => ({
        url: '',
        method: 'GET'
      }),
      providesTags: ['slider']
    }),
    postSlider: build.mutation({
      query: (data) => ({
        url: '',
        method: 'POST',
        body: data
      }),
      invalidatesTags: ['slider']
    }),
    patchSlider: build.mutation({
      query: ({id, data}) => ({
        url: `/${id}`,
        method: 'PATCH',
        body: data
      }),
      invalidatesTags: ['slider']
    }),
    deleteSlider: build.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['slider']
    }),
  })
})

export const {useGetSliderQuery, usePostSliderMutation, usePatchSliderMutation, useDeleteSliderMutation} = api