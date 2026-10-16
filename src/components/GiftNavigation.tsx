import { useRef } from "react";
import { sections } from "../data/dreamScenes";
import { ArrowIcon } from "./ArrowIcon";

export function GiftNavigation({ active, onNavigate }: { active: string; onNavigate: (id: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = () => dialog.current?.close();

  return (
    <>
      <header className="gift-header">
        <a className="wordmark" href="#intro" aria-label="Ling，回到开头">Ling</a>
        <button className="directory-trigger text-link" type="button" onClick={() => dialog.current?.showModal()} aria-haspopup="dialog">
          回忆目录
        </button>
      </header>
      <dialog className="directory" ref={dialog} aria-labelledby="directory-title" onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
        <div className="directory-heading">
          <h2 id="directory-title">回忆目录</h2>
          <button className="close-button" type="button" onClick={close} aria-label="关闭目录"><svg className="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19" /></svg></button>
        </div>
        <nav className="scene-rail" aria-label="场景导航">
          {sections.map((section) => (
            <a key={section.id} href={`#${section.id}`} onClick={() => { onNavigate(section.id); close(); }} className={active === section.id ? "active" : ""} aria-current={active === section.id ? "location" : undefined}>
              <span className="directory-number">{section.label}</span>
              <span>{section.title}</span>
              <span className="directory-arrow"><ArrowIcon direction="up-right" /></span>
            </a>
          ))}
        </nav>
      </dialog>
    </>
  );
}
