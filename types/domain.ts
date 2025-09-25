export type SortKey = "price" | "rating" | "name";
export type SortDir = "asc" | "desc";

export interface ProductDTO {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string;
  averageRating: number;
  reviewCount: number;
}

export interface ReviewDTO {
  id: string;
  productId: string;
  authorName: string;
  title: string;
  body: string;
  rating: number;
  createdAt: string;
}
