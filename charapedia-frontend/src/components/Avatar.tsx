import { assetUrl } from "../api";

interface Props {
  src?: string | null;
  name: string;
  size?: number;
}

// 프로필 사진이 있으면 사진, 없으면 닉네임 첫 글자를 원 안에 보여준다
export function Avatar({ src, name, size = 32 }: Props) {
  const url = assetUrl(src);
  const style = { width: size, height: size, fontSize: Math.round(size * 0.45) };

  if (url) {
    return <img className="avatar" src={url} alt={`${name} 프로필 사진`} style={style} />;
  }
  return (
    <span className="avatar avatar-fallback" style={style} aria-hidden="true">
      {Array.from(name)[0] ?? "?"}
    </span>
  );
}
