import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State { failed: boolean }

export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Routine UI error', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="fatal-state" dir="rtl">
        <div className="brand-mark" aria-hidden="true">ر</div>
        <h1>تعذّر عرض الصفحة</h1>
        <p>بياناتك المحلية لم تُحذف. أعد فتح الواجهة.</p>
        <button type="button" onClick={() => window.location.reload()}>إعادة المحاولة</button>
      </main>
    );
  }
}
