import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, PlusCircle, Search, CheckCircle2, type LucideIcon } from 'lucide-react';

interface Step {
  number: number;
  title: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

const steps: Step[] = [
  {
    number: 1,
    title: 'Reporte um Problema',
    description:
      'Encontrou um buraco, uma lâmpada queimada ou lixo acumulado? Faça login e crie uma nova ocorrência com descrição e localização exata no mapa.',
    icon: PlusCircle,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    number: 2,
    title: 'Acompanhe a Região',
    description:
      'Use a barra de pesquisa na página inicial para encontrar sua rua ou bairro. O mapa exibe as ocorrências daquela área com marcadores coloridos por status.',
    icon: Search,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    number: 3,
    title: 'Mapa Interativo',
    description:
      'Navegue livremente. Cada marcador representa uma ocorrência — vermelho para aberta, laranja para em andamento, verde para resolvida.',
    icon: MapPin,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    number: 4,
    title: 'Ações e Resoluções',
    description:
      'As ocorrências ficam salvas em banco de dados público para que cidadãos, a prefeitura e instituições possam visualizar e agir para resolver os problemas.',
    icon: CheckCircle2,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
];

export default function Instructions() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      {/* Hero */}
      <div className="text-center mb-14">
        <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight mb-3">
          Como funciona o Alerta Rua?
        </h1>
        <p className="text-neutral-500 text-[15px] leading-relaxed">
          Um guia rápido para ajudar você a cuidar melhor da sua cidade.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              className="card-hover flex items-start gap-5 bg-white border border-neutral-100 rounded-2xl p-6"
            >
              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${step.iconBg}`}
              >
                <Icon className={`w-5 h-5 ${step.iconColor}`} />
              </div>

              {/* Content */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">
                    Passo {step.number}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-neutral-900 mb-1.5">{step.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="mt-10 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-6 py-3 rounded-xl hover:bg-blue-700 transition shadow-sm"
        >
          <MapPin className="w-4 h-4" />
          Ver o Mapa Agora
        </Link>
      </div>
    </div>
  );
}
