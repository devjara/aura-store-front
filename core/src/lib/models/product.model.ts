export interface Product 
{
    id:number;
    name:string;
    description:string;
    longDescription?:string;
    price:number;
    imageUrl:string;
    category:string;
    stock:number;
    active:boolean;
}
