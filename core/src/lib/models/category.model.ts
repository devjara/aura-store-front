export interface Category
{
    id: number;
    parentId: number;
    name: string;
    slug: string;
    description: string;
    imageUrl?: string;
    active: boolean;
}
