import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
interface ICard {
  title: string;
  descricao: string;
  imagem: string;
  bg_imagem: string;
  url: string;
}

export default function Card({
  title,
  descricao,
  imagem,
  bg_imagem,
  url,
}: ICard) {
  // obter card
  const cardRef = useRef<HTMLDivElement>(null);

  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setIsCompact(entry.contentRect.width < 300);
    });
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-card rounded-sm w-full border border-border overflow-hidden transition-colors hover:border-[#306FCC]/40">
      <div
        ref={cardRef}
        className={
          isCompact
            ? 'flex flex-col gap-4 p-4 items-center text-center'
            : 'flex flex-row gap-4 p-4 min-h-[130px]'
        }
      >
        <div className={isCompact ? '' : 'shrink-0'}>
          <div
            className={
              'flex items-center justify-center w-16 h-16 rounded-full ' +
              bg_imagem
            }
          >
            <img src={imagem} alt="" className="w-8 h-8" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-lg mb-1 overflow-hidden text-ellipsis whitespace-nowrap text-foreground">
            {title}
          </h2>
          <span className="text-muted-foreground text-sm block overflow-hidden text-ellipsis line-clamp-2">
            {descricao}
          </span>
        </div>
      </div>
      <hr className="border-border" />
      <div className="text-center p-3 text-[#306FCC] overflow-hidden">
        <Link
          href={url}
          className="inline-flex items-center group font-medium text-sm transition-all duration-300 hover:text-blue-700"
        >
          Acessar
          <img
            className="ml-2 w-1.5 transition-transform duration-300 group-hover:translate-x-1"
            src="/acessar.svg"
            alt=""
          />
        </Link>
      </div>
    </div>
  );
}
