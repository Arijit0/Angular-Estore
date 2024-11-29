import { Component, OnInit } from '@angular/core';
import { MasterService } from '../services/master.service';
import { Router } from '@angular/router';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [NgxSkeletonLoaderModule],
  templateUrl: './category.component.html',
  styleUrl: './category.component.css'
})
export class CategoryComponent implements OnInit{

  categories: string[] = [];
  categoryName: string = "";
  widthHeightSizeInPixels = 50;
  isCategory: boolean = false;

  constructor(private http: MasterService,private router: Router) {}

  ngOnInit(): void {
    this.getAllCategories();
  }


  getAllCategories() {
    this.http.getCategories().subscribe((res: any) => {
    setTimeout(() => {
      this.categories = res;
      this.isCategory = true;
    },1000)
      
    })
  }

  getProductsBycategory(item: string) {
    this.categoryName = item;
    this.router.navigate([`/category/${this.categoryName}`],{queryParams:{categoryName: this.categoryName}});
  }
  
}
