import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Globe, Phone, MessageCircle, Mail, AtSign, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  instagramHandleLabel,
  normalizeEmailUrl,
  normalizePhoneTelUrl,
  normalizeInstagramUrl,
  normalizeWhatsappUrl,
} from "@/lib/contactLinks";

interface TextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  icon: ReactNode;
  children: ReactNode;
}

/** Link de contato "grande", com rótulo — usado na página de detalhes. */
function TextLink({ icon, children, className, ...props }: TextLinkProps) {
  return (
    <a
      className={cn(
        "group inline-flex items-center gap-1.5 text-sm font-medium text-brand transition-colors hover:text-indigo-700",
        className
      )}
      {...props}
    >
      {icon}
      <span className="underline decoration-brand/30 underline-offset-2 group-hover:decoration-indigo-700">
        {children}
      </span>
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </a>
  );
}

export function SiteTextLink({ website }: { website: string | null }) {
  if (!website) return <span className="text-sm text-muted">Site não encontrado</span>;
  return (
    <TextLink icon={<Globe className="h-4 w-4" />} href={website} target="_blank" rel="noopener noreferrer">
      Visitar site
    </TextLink>
  );
}

export function InstagramTextLink({ instagram }: { instagram: string | null }) {
  if (!instagram) return <span className="text-sm text-muted">Instagram não encontrado</span>;
  const url = normalizeInstagramUrl(instagram);
  const label = instagramHandleLabel(instagram);
  return (
    <TextLink icon={<AtSign className="h-4 w-4" />} href={url ?? undefined} target="_blank" rel="noopener noreferrer">
      {label}
    </TextLink>
  );
}

export function WhatsappTextLink({ whatsapp }: { whatsapp: string | null }) {
  if (!whatsapp) return <span className="text-sm text-muted">WhatsApp não encontrado</span>;
  const url = normalizeWhatsappUrl(whatsapp);
  return (
    <TextLink icon={<MessageCircle className="h-4 w-4" />} href={url ?? undefined} target="_blank" rel="noopener noreferrer">
      Abrir WhatsApp
    </TextLink>
  );
}

export function PhoneTextLink({ phone }: { phone: string | null }) {
  if (!phone) return <span className="text-sm text-muted">Telefone não encontrado</span>;
  const url = normalizePhoneTelUrl(phone);
  return (
    <TextLink icon={<Phone className="h-4 w-4" />} href={url ?? undefined}>
      Ligar ({phone})
    </TextLink>
  );
}

export function EmailTextLink({ email }: { email: string | null }) {
  if (!email) return <span className="text-sm text-muted">E-mail não encontrado</span>;
  const url = normalizeEmailUrl(email);
  return (
    <TextLink icon={<Mail className="h-4 w-4" />} href={url ?? undefined}>
      {email}
    </TextLink>
  );
}

interface IconLinkProps {
  href: string | null;
  label: string;
  icon: ReactNode;
  tel?: boolean;
}

function IconLink({ href, label, icon, tel }: IconLinkProps) {
  if (!href) return null;
  return (
    <a
      href={href}
      target={tel ? undefined : "_blank"}
      rel={tel ? undefined : "noopener noreferrer"}
      title={label}
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition-all hover:-translate-y-0.5 hover:bg-brand-soft hover:text-brand"
    >
      {icon}
    </a>
  );
}

/** Linha compacta de ícones de contato — usada em tabela e cards. */
export function ContactIconRow({
  website,
  instagram,
  whatsapp,
  phone,
  email,
}: {
  website: string | null;
  instagram: string | null;
  whatsapp: string | null;
  phone: string | null;
  email: string | null;
}) {
  const items = [
    { href: website, label: "Visitar site", icon: <Globe className="h-4 w-4" /> },
    {
      href: normalizeInstagramUrl(instagram),
      label: instagramHandleLabel(instagram) ?? "Instagram",
      icon: <AtSign className="h-4 w-4" />,
    },
    {
      href: normalizeWhatsappUrl(whatsapp),
      label: "Abrir WhatsApp",
      icon: <MessageCircle className="h-4 w-4" />,
    },
    { href: normalizePhoneTelUrl(phone), label: `Ligar (${phone})`, icon: <Phone className="h-4 w-4" />, tel: true },
    { href: normalizeEmailUrl(email), label: email ?? "E-mail", icon: <Mail className="h-4 w-4" /> },
  ].filter((item) => item.href);

  if (items.length === 0) {
    return <span className="text-xs text-muted">Sem contatos verificados</span>;
  }

  return (
    <div className="flex items-center gap-0.5">
      {items.map((item, idx) => (
        <IconLink key={idx} href={item.href} label={item.label} icon={item.icon} tel={item.tel} />
      ))}
    </div>
  );
}
