import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { DemoComponent } from './demo/demo.component';
import { NgUniversalFilePreviewerModule } from '../../../ng-universal-file-previewer/src/lib/ng-universal-file-previewer.module';

@NgModule({
  declarations: [AppComponent, DemoComponent],
  imports: [BrowserModule, FormsModule, NgUniversalFilePreviewerModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
