'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ArrowRight,
  Play,
  TrendingUp,
  PieChart,
  Target,
  Sparkles,
  Lock,
  Smartphone,
  ChevronRight,
  CheckCircle2,
  Users,
  LineChart,
  Wallet,
} from 'lucide-react';
import { Reveal } from './Reveal';
import { FAQItem } from './FAQItem';
import { ProductMockup } from './ProductMockup';
import { MiniScreens } from './MiniScreens';
import { HeroFlipWords } from './HeroFlipWords';
import styles from './LandingView.module.css';

const HERO_FLIP_WORDS = ['argent', 'budget', 'finances'] as const;

const NAV = [
  { href: '#valeur', label: 'Valeur' },
  { href: '#fonctionnalites', label: 'Fonctionnalités' },
  { href: '#apercu', label: 'Aperçu' },
  { href: '#faq', label: 'FAQ' },
];

export function LandingView() {
  return (
    <div className={styles.page}>
      <div className={styles.bgMesh} aria-hidden />

      <header className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.brand}>
            <ShieldCheck className={styles.brandIcon} size={26} strokeWidth={2.2} />
            BudgetFacile
          </Link>
          <nav className={styles.navLinks} aria-label="Navigation landing">
            {NAV.map((n) => (
              <a key={n.href} href={n.href}>
                {n.label}
              </a>
            ))}
          </nav>
          <div className={styles.navActions}>
            <Link href="/login" className={styles.linkQuiet}>
              Connexion
            </Link>
            <Link href="/dashboard" className="btn btn--primary btn--sm">
              Démarrer gratuitement
            </Link>
          </div>
        </div>
      </header>

      <main className={styles.content}>
        {/* Hero */}
        <section id="hero" className={`${styles.section} ${styles.sectionNarrow}`} aria-labelledby="hero-title">
          <div className={styles.containerWide}>
            <div className={styles.heroGrid}>
              <Reveal>
                <div className={styles.heroCopy}>
                  <div className={styles.heroBadge}>
                    <Sparkles size={14} strokeWidth={2} aria-hidden />
                    Budgets, transactions et objectifs au même endroit
                  </div>
                  {/* Titre sr-only + bloc visuel (div autorisé) */}
                  <div className={styles.heroHeading}>
                    <h1 id="hero-title" className="visually-hidden">
                      Clarifiez votre argent, budget ou finances. Décidez en confiance.
                    </h1>
                    <div className={styles.heroTitle}>
                      <div className={styles.heroTitleRow}>
                        <span className={styles.heroTitleLine}>Clarifiez votre </span>
                        <span className={styles.heroFlipInline}>
                          <HeroFlipWords words={[...HERO_FLIP_WORDS]} intervalMs={3500} />
                        </span>
                      </div>
                      <p className={styles.heroTitleAccent}>Décidez en confiance.</p>
                    </div>
                  </div>
                  <p className={styles.heroSub}>
                    BudgetFacile centralise vos transactions, budgets par enveloppe et objectifs d'épargne dans une interface sobre et lisible — pour voir où va votre argent et garder le contrôle, sans tableur ni bruit inutile.
                  </p>
                  <div className={styles.ctaRow}>
                    <Link href="/dashboard" className="btn btn--primary btn--lg">
                      Démarrer gratuitement <ArrowRight size={18} strokeWidth={2} />
                    </Link>
                    <Link href="/demo/dashboard" className="btn btn--secondary btn--lg">
                      <Play size={18} strokeWidth={2} aria-hidden />
                      Voir la démo
                    </Link>
                  </div>
                  <div className={styles.reassurance} role="list">
                    <div className={styles.reassuranceItem} role="listitem">
                      <Lock size={16} strokeWidth={2} aria-hidden />
                      Données sécurisées avec Supabase
                    </div>
                    <div className={styles.reassuranceItem} role="listitem">
                      <Smartphone size={16} strokeWidth={2} aria-hidden />
                      Saisie 100 % manuelle &amp; maîtrisée
                    </div>
                    <div className={styles.reassuranceItem} role="listitem">
                      <CheckCircle2 size={16} strokeWidth={2} aria-hidden />
                      Interface calme, sans pub ni IA
                    </div>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={80}>
                <ProductMockup />
              </Reveal>
            </div>
          </div>
        </section>

        {/* Preuve de valeur */}
        <section id="valeur" className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.container}>
            <Reveal>
              <div className={`${styles.sectionHead} ${styles.center}`}>
                <p className={styles.eyebrow}>Pourquoi BudgetFacile</p>
                <h2 className={styles.h2}>Une vision claire de votre argent, enfin</h2>
                <p className={styles.lead}>
                  Conçu pour les personnes qui veulent comprendre leur situation financière en quelques minutes — sans algorithme, sans pub, sans abonnement forcé.
                </p>
              </div>
            </Reveal>
            <Reveal delay={60}>
              <div className={styles.stats}>
                {[
                  { value: '5 sections', label: 'Dashboard, Transactions, Budget, Objectifs, Analyses' },
                  { value: '0 IA', label: 'Vos données, votre contrôle — aucune boîte noire' },
                  { value: '100 %', label: 'Personnalisable : devises, catégories, comptes' },
                  { value: '24/7', label: "Accès sécurisé depuis n'importe quel appareil" },
                ].map((s) => (
                  <div key={s.label} className={styles.statCard}>
                    <div className={styles.statValue}>{s.value}</div>
                    <div className={styles.statLabel}>{s.label}</div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* Ce que vous pouvez suivre */}
        <section className={styles.section}>
          <div className={styles.container}>
            <Reveal>
              <div className={styles.sectionHead}>
                <p className={styles.eyebrow}>Ce que vous pouvez suivre</p>
                <h2 className={styles.h2}>Tout ce qui compte pour votre équilibre financier</h2>
                <p className={styles.lead}>
                  Des dépenses quotidiennes aux objectifs long terme : reliez les vraies habitudes aux vrais chiffres.
                </p>
              </div>
            </Reveal>
            <div className={styles.grid3}>
              {[
                {
                  icon: Wallet,
                  title: 'Dépenses & revenus',
                  text: 'Historique filtrable, catégories cohérentes, vision par compte.',
                },
                {
                  icon: PieChart,
                  title: 'Budgets par enveloppe',
                  text: 'Plafonds clairs, suivi du reste à dépenser, alertes sobres.',
                },
                {
                  icon: Target,
                  title: "Objectifs d'épargne",
                  text: 'Projets nommés, progression dans le temps, priorisation simple.',
                },
                {
                  icon: LineChart,
                  title: 'Patrimoine & tendances',
                  text: "Courbes lisibles pour relier vos décisions à l'évolution globale.",
                },
                {
                  icon: Sparkles,
                  title: 'Analyses & tendances',
                  text: "Évolution du patrimoine, variation sur 6 mois, pistes d'amélioration basées sur vos chiffres réels.",
                },
                {
                  icon: Users,
                  title: 'Quotidien familial',
                  text: 'Pensé pour un usage personnel ou partagé, sans complexifier la vue.',
                },
              ].map((item, i) => (
                <Reveal key={item.title} delay={i * 40}>
                  <div className={styles.cardFeature}>
                    <div className={styles.iconBox}>
                      <item.icon size={22} strokeWidth={2} />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Aperçu produit */}
        <section id="apercu" className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.container}>
            <Reveal>
              <div className={`${styles.sectionHead} ${styles.center}`}>
                <p className={styles.eyebrow}>Aperçu du tableau de bord</p>
                <h2 className={styles.h2}>Le même langage visuel que votre espace connecté</h2>
                <p className={styles.lead}>
                  Cartes, hiérarchie typographique et accent unique : ce que vous voyez ici est ce que vous retrouvez
                  dans l'application.
                </p>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <MiniScreens />
            </Reveal>
          </div>
        </section>

        {/* Comment ça marche */}
        <section id="comment" className={styles.section}>
          <div className={styles.container}>
            <Reveal>
              <div className={`${styles.sectionHead} ${styles.center}`}>
                <p className={styles.eyebrow}>Comment ça marche</p>
                <h2 className={styles.h2}>Trois étapes. Des résultats concrets.</h2>
              </div>
            </Reveal>
            <div className={styles.steps}>
              {[
                {
                  n: '1',
                  title: 'Configurez',
                  text: 'Ajoutez vos comptes, catégories et devise en quelques clics depuis les Paramètres.',
                },
                {
                  n: '2',
                  title: 'Saisissez',
                  text: "Enregistrez vos transactions, fixez des plafonds de budget et créez vos objectifs d'épargne.",
                },
                {
                  n: '3',
                  title: 'Pilotez',
                  text: "Lisez vos tendances, suivez l'avancement de vos objectifs et ajustez vos habitudes.",
                },
              ].map((step, i) => (
                <Reveal key={step.title} delay={i * 50}>
                  <div className={styles.step}>
                    <div className={styles.stepNum}>{step.n}</div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Bénéfices + Pensé pour quotidien + Contrôle */}
        <section id="fonctionnalites" className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.container}>
            <Reveal>
              <div className={styles.sectionHead}>
                <p className={styles.eyebrow}>Fonctionnalités clés</p>
                <h2 className={styles.h2}>Simple à prendre en main, puissant au quotidien</h2>
              </div>
            </Reveal>
            <div className={styles.grid2}>
              <Reveal>
                <div className={styles.cardFeature}>
                  <div className={styles.iconBox}>
                    <TrendingUp size={22} strokeWidth={2} />
                  </div>
                  <h3>Tout au même endroit</h3>
                  <p>
                    Patrimoine, transactions, budgets par enveloppe et objectifs d'épargne — une seule lecture du « où j'en suis », sans jongler entre plusieurs outils.
                  </p>
                </div>
              </Reveal>
              <Reveal delay={50}>
                <div className={styles.cardFeature}>
                  <div className={styles.iconBox}>
                    <Lock size={22} strokeWidth={2} />
                  </div>
                  <h3>Confidentialité et transparence</h3>
                  <p>
                    Saisie manuelle, données stockées de façon sécurisée, zéro publicité, zéro IA. Vous savez exactement ce que l'app fait — et ce qu'elle ne fait pas.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Témoignage */}
        <section id="temoignages" className={styles.section}>
          <div className={styles.container}>
            <Reveal>
              <div className={`${styles.sectionHead} ${styles.center}`}>
                <p className={styles.eyebrow}>Retour d'expérience</p>
                <h2 className={styles.h2}>Une interface qui rassure dès les premières minutes</h2>
              </div>
            </Reveal>
            <Reveal delay={60}>
              <blockquote className={styles.quote}>
                <p className={styles.quoteText}>
                  « Enfin une app qui ne me met pas la pression. Je vois mes postes de dépenses, mes objectifs d'épargne en cours, et je sais exactement quoi ajuster — sans passer mon dimanche dans un tableur. »
                </p>
                <footer className={styles.quoteAuthor}>
                  <strong>Claire M.</strong> — usage personnel, objectif voyage en cours
                </footer>
              </blockquote>
            </Reveal>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className={`${styles.section} ${styles.sectionAlt}`}>
          <div className={styles.container}>
            <Reveal>
              <div className={`${styles.sectionHead} ${styles.center}`}>
                <p className={styles.eyebrow}>FAQ</p>
                <h2 className={styles.h2}>Questions fréquentes</h2>
                <p className={styles.lead} style={{ margin: '0 auto' }}>
                  Réponses courtes — pour avancer sans friction.
                </p>
              </div>
            </Reveal>
            <Reveal delay={40}>
              <div className={styles.faqList}>
                <FAQItem
                  question="BudgetFacile remplace-t-il ma banque ?"
                  answer="Non. L'application aide à organiser et lire vos finances ; elle ne substitue pas les services d'un établissement financier."
                />
                <FAQItem
                  question="Puis-je suivre plusieurs comptes ?"
                  answer="Oui. Vous pouvez structurer par compte (courant, épargne, cartes) pour une vision consolidée."
                />
                <FAQItem
                  question="Comment fonctionnent les objectifs d'épargne ?"
                  answer="Vous créez un projet (voyage, achat, fonds d'urgence…), définissez un montant cible et, si vous le souhaitez, une date limite. L'app calcule alors combien mettre de côté chaque mois. Il vous suffit d'enregistrer vos versements manuellement pour suivre la progression en temps réel."
                />
                <FAQItem
                  question="Est-ce adapté à un usage familial ?"
                  answer="Oui. L'interface reste lisible pour un suivi partagé, sans complexifier les écrans pour autant."
                />
                <FAQItem
                  question="Puis-je exporter mes données ?"
                  answer="Oui. Depuis les Paramètres → Export / import, vous pouvez télécharger toutes vos transactions au format CSV à tout moment."
                />
              </div>
            </Reveal>
          </div>
        </section>

        {/* CTA final */}
        <section className={styles.section}>
          <div className={styles.container}>
            <Reveal>
              <div className={styles.ctaBlock}>
                <h2 className={styles.h2}>Prêt à reprendre le contrôle de vos finances ?</h2>
                <p className={styles.lead}>
                  Créez votre compte, configurez vos catégories et vos comptes en moins de 5 minutes — gratuit pour démarrer.
                </p>
                <div className={styles.ctaRow} style={{ justifyContent: 'center' }}>
                  <Link href="/dashboard" className="btn btn--primary btn--lg">
                    Démarrer gratuitement <ChevronRight size={18} strokeWidth={2} />
                  </Link>
                  <Link href="/login" className="btn btn--ghost btn--lg">
                    J'ai déjà un compte
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <ShieldCheck size={18} className={styles.brandIcon} />
            © {new Date().getFullYear()} BudgetFacile
          </div>
          <div className={styles.footerLinks}>
            <Link href="#">Confidentialité</Link>
            <Link href="#">Conditions</Link>
            <Link href="#">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
