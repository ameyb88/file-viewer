import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <app-demo></app-demo>

      <footer class="app-footer">
        <p>
          &copy; 2024 Angular Universal File Previewer. Open source file preview
          library.
        </p>
        <div class="footer-links">
          <a
            href="https://github.com/yourusername/ng-universal-file-previewer"
            target="_blank"
            >GitHub</a
          >
          <a
            href="https://www.npmjs.com/package/ng-universal-file-previewer"
            target="_blank"
            >NPM</a
          >
        </div>
      </footer>
    </div>
  `,
  styles: [
    `
      .app-container {
        min-height: 100vh;
        background: #ffffff;
      }

      .app-footer {
        background: #f8fafc;
        padding: 32px 20px;
        text-align: center;
        border-top: 1px solid #e5e7eb;
        margin-top: 40px;

        p {
          margin: 0 0 16px 0;
          color: #64748b;
        }

        .footer-links {
          display: flex;
          justify-content: center;
          gap: 24px;

          a {
            color: #3b82f6;
            text-decoration: none;
            font-weight: 500;

            &:hover {
              text-decoration: underline;
            }
          }
        }
      }

      @media (max-width: 768px) {
        .footer-links {
          flex-direction: column;
          gap: 12px;
        }
      }
    `,
  ],
})
export class AppComponent {
  title = 'ng-universal-file-previewer-demo';
}
