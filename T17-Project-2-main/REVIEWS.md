# Review Summary P2: IT2810-H25-T17

*Generated on 2025-11-12*

**Takk for at du leser tilbakemeldingene fra medstudentvurderingene!**
Vi vil gjerne høre din mening om de oppsummerte tilbakemeldingene. Bruk dette [spørreskjemaet](https://nettskjema.no/a/565641). Etter å ha svart på skjemaet har du mulighet til å være med i trekking av 3 gavekort á 200 kroner.

---

## Tilgjengelighet

**Sterk tilgjengelighet og små forbedringspunkter**  
Til tross for at den generelle tilgjengeligheten oppleves som svært god, er det nevnt noen få og små forbedringspunkter. Lighthouse viser 100 i Performance og 100 i Accessibility, og flere kommentarer peker på solid semantisk HTML, riktige ARIA-attributter og tydelig tastaturnavigasjon. Bruken av alt-tekster, aria-labelledby og fokus-stiler blir også rost av flere, noe som gir god støtte for skjermlesere. En liten forbedring som Lighthouse nevner, er justering av cache lifetimes på enkelte assets, men dette anses som marginelt og påvirker ikke hovedtilgjengeligheten. Samlet sett beskrives kjernen i brukerflyten (søk og nå-spilles) som svært tilgjengelig, med få, mindre justeringer som potensielt kan vurderes videre.

Reviewer(s): [Jack](#tilgjengelighet-jack), [Noah34](#tilgjengelighet-noah34), [Miles](#tilgjengelighet-miles), [Xander31](#tilgjengelighet-xander31), [Val](#tilgjengelighet-val), [Quinn26](#tilgjengelighet-quinn26), [Max](#tilgjengelighet-max)


----------------------------------------

**Tastaturnavigasjon og fokusstyring i interaktive elementer**  
Det er bekymringer knyttet til tastaturnavigasjon og fokusstyring i interaktive elementer, spesielt rundt kort og listeelementer, samt dropdowns og menyer. Jack påpeker at navigasjonen ikke alltid har tydelig tab-fokus eller riktig semantikk, slik at fokusrekkefølgen blir uforutsigbar. Miles legger vekt på manglende fokusstyring i dropdowns/menyer, i tillegg til at den globale navbaren har hardkodet posisjon som kan gjøre KB-fokus uforutsigbart. Xander31 og Max bekrefter at tab-navigasjon ikke alltid dekker sortering/filtrering, og at piltastene ikke alltid gir konsistent kontroll i filter og genre. Dette påvirker tilgjengeligheten ved at tastaturnbrukere kan oppleve uklart fokus og ineffektiv måter å interagere med sortering og filtrering. Forslagene inkluderer å sikre semantiske interaktive elementer (bruk av button/a der det passer), etablering av konsistent tab-fokus og å støtte sortering/filtrering fullt ut via tastaturnavigasjon i alle komponenter.

Reviewer(s): [Jack](#tilgjengelighet-jack), [Miles](#tilgjengelighet-miles), [Xander31](#tilgjengelighet-xander31), [Max](#tilgjengelighet-max)


----------------------------------------

**Eksplisitt WCAG-vurdering og kontrasttesting mangler**  
Noah34 påpeker at selv om grunnleggende tilgjengelighet er god, mangler det en eksplisitt WCAG-vurdering, samt skip-links og kontrasttesting. Dette gjør det vanskelig å dokumentere etterlevelse og verifisere tilgjengelighet for ulike brukergrupper. En konkret løsning er å inkludere skip-links for rask navigasjon, gjennomføre kontrast-testing for alle interaktive komponenter og utarbeide en formell WCAG-vurdering. Dette vil styrke dokumentasjonen og bidra til tydeligere samsvar med WCAG-prinsippene.

Reviewer(s): [Noah34](#tilgjengelighet-noah34)

---

## Funksjonalitet

**Håndtering av spillelister: sletting, endring av navn og duplikater**
Dette problemet handler om administrasjon av spillelister. Ifølge tilbakemeldingene mangler det en tydelig måte å slette en spilleliste på, og det bør også være mulig å endre tittelen på en eksisterende liste. I tillegg blir duplikater et problem når man klikker «create» flere ganger, og det finnes tydelig ønske om å kunne forhindre at spillelister med samme navn opprettes. Dette kan føre til rot i biblioteket og dårlig brukeropplevelse. For å løse det bør man legge til slette- og endre-navn-funksjonalitet, forhindre duplikatnavn og gi brukeren tydelig tilbakemelding ved handlinger som oppretter eller endrer lister.

Reviewer(s): [Miles](#funksjonalitet-miles), [Xander31](#funksjonalitet-xander31), [Max](#funksjonalitet-max)

------------------------------

**Tydeligere avspilling og detaljvisning per sang**
Brukere ønsker en mer eksplisitt måte å starte avspilling på hver sang og en tydelig vei til mer informasjon om objektet. Xander31 peker på at det mangler en egen play-knapp per sang og at prosjektbeskrivelsen antyder at man bør kunne se mer detaljer om hvert element. Max supplerer med at det burde være tydeligere at å klikke på et element spiller av sangen. Dette påvirker opplevelsen ved at brukere kan være usikre på hvordan de skal få fart i avspillingen eller få tilgang til detaljer. En løsning er å legge inn en tydelig play-knapp ved hver sang og gjøre det enklere å åpne en detaljside eller panel for singlene.

Reviewer(s): [Xander31](#funksjonalitet-xander31), [Max](#funksjonalitet-max)

------------------------------

**Søkefunksjonalitet trenger typeahead og debouncing**
Feedback fra Jack indikerer at søkefunksjonen føles litt statisk: forslag vises ikke mens man skriver, og søk skjer uten debouncing, noe som kan føre til unødvendige spørringer. Han påpeker også at søket i dag kobles til en Submit-knapp. Dette kan påvirke brukeropplevelsen ved at det tar lengre tid å finne relevante resultater og at systemet blir mer utsatt for unødvendig belastning. Forbedringen foreslås å inkludere typeahead/autocomplete og debouncing slik at spørringene skjer raskt og smidig mens brukeren skriver.

Reviewer(s): [Jack](#funksjonalitet-jack)

------------------------------

**Initielt tomt grensesnitt og filtrering som ikke fungerer før resultater vises**
Xander31 peker på at siden starter uten resultater og at man ikke kan legge på filtrering før man får resultater. Han nevner også at siste søk ikke blir lagret og at navigering til/fra Playlists krever at man søker og setter filtre på nytt. Dette gjør det vanskelig å få en rask oversikt og opprettholde kontekst når man beveger seg mellom sider. Løsningen bør være å vende tilbake resultater eller forhåndsfulle data ved første innlasting, og å bevare søke- og filtertilstand på tvers av navigasjon.

Reviewer(s): [Xander31](#funksjonalitet-xander31)

------------------------------

**Krasj ved oppfriskning og navigasjons-vaner som trenger forbedring**
Noah34 bemerker at siden krasjer når man oppdaterer mens man er inne på en spilleliste, noe som gjør applikasjonen ustabil ved feil eller nettverksproblemer. Dette påvirker påliteligheten og skaper frustasjon hos brukere som prøver å navigere eller oppdatere. I tillegg nevner han behov for flere interaksjoner (f.eks. flereknapper) for å gjøre siden mer engasjerende. Løsningen bør fokusere på robusthet ved oppfriskning og forbedring av interaksjonsmuligheter.

Reviewer(s): [Noah34](#funksjonalitet-noah34)

------------------------------

**AppShell og lenkehåndtering som hindrer naturlig navigering**
Miles peker på et teknisk problem der en global dokument-lytter i AppShell kaprer alle lenker i stedet for å bruke den riktige <Link>-navigasjonen. Dette kan hindre riktig SPA-navigasjon og fører til uforutsigbar oppførsel. For å forbedre utvikleropplevelsen og brukeropplevelsen må man bytte til konvensjonell, SPA-kompatibel lenkestyring og fjerne den globale lytter som tar over lenkene.

Reviewer(s): [Miles](#funksjonalitet-miles)

---

## Design og utforming

**Responsiveness og mobiltilpasning trenger forbedring**  
Designet er estetisk solid, men det er tydelige utfordringer med responsiviteten når skjermen blir smalere. Flere kommenterer at knapper og kontroller kan gå utenfor skjermen eller overlappe på mobil, og at noen elementer har hardkodede posisjoner eller bredder som ikke tilpasses mindre skjermer. Dette påvirker brukervennlighet og handlinger som søk, filtrering og å legge til sanger i spillelister, spesielt i spillist- og navigasjonsområdene. Forslagene som går igjen er å gjøre bredder og marger fleksible, fjerne faste posisjoner og bruke mer adaptive breakpoints slik at layouten oppfører seg konsistent på mobil og PC. Dette er et viktig forbedringsområde ifølge flere bidragsytere (Jack, Miles, Xander31, Val, Wendy, Quinn26, Noah34 og Max).

Reviewer(s): [Jack](#design-og-utforming-jack), [Noah34](#design-og-utforming-noah34), [Miles](#design-og-utforming-miles), [Xander31](#design-og-utforming-xander31), [Val](#design-og-utforming-val), [Wendy](#design-og-utforming-wendy), [Quinn26](#design-og-utforming-quinn26), [Max](#design-og-utforming-max)

---

**Farger og branding bør være mer dynamisk**  
Flere kritikere peker på at fargebruken og den visuelle branding ikke helt utnytter mulighetene i appen. Noah34 ønsker en mer elektrisk og energisk fargebruk, samt mer livlige effekter og animerte detaljer som passer musikktemaet. Quinn26 påpeker at filter og sjanger ikke alltid følger resten av stil, noe som gjør at farger og grafiske elementer ikke oppleves som helt konsistente. Max nevner også at forskjellen mellom dark- og light-mode burde være tydeligere og mer tydelig adskilt. Disse innspillene peker mot en mer markant fargepalett, bedre branding og bedre konsistens mellom moduser og UI-komponenter.

Reviewer(s): [Noah34](#design-og-utforming-noah34), [Quinn26](#design-og-utforming-quinn26), [Max](#design-og-utforming-max)

---

**Hovedsiden mangler innhold før søk**  
Max påpeker at hovedsiden i stor grad fremstår som tom før brukeren gjør et søk, noe som kan gi en mindre innbydende førsteinntrykk. Han foreslår å vise noen tilfeldige eller forhåndslagrede sanger som standard for å gi inntrykk av innhold fra starten. Dette vil kunne gjøre opplevelsen mer engasjerende og gi brukeren en tydeligere ide om hva som er tilgjengelig i appen. En enkel løsning kan være å legge inn et lite forslagspanel eller en forhåndsvisning ved første visning.

Reviewer(s): [Max](#design-og-utforming-max)

---

## Bærekraft

Manglende eksplisitt bærekraftdokumentasjon og beslutningsgrunnlag
Flere av vurdererne peker på at bærekraftige valg er tydelige i implementasjonen (som dark mode, caching, systemfonter, begrenset datamengde og bruk av iTunes-API med lokal caching), men dokumentasjonen rundt hvorfor disse valgene ble tatt mangler. Miles nevner at dokumentasjonen sier lite om bærekraft, og Val påpeker at gruppen ikke har forklart bærekraftstrategien, selv om valgene virker effektive. Quinn26 legger til at bærekraftige valg ikke er forklart, selv om de virker gjennomtenkte, og Noah34 påpeker at bærekraft utover de tekniske gevinstene ikke er tydelig i presentasjonen. Dette gjør det vanskelig å vurdere langsiktige konsekvenser og trade-offs. Et forslag er å legge til et kort avsnitt i README som oppsummerer bærekraftvurderinger, beslutninger og forventede effekter, samt beskrive nødvendige forbedringer. 
Reviewer(s): [Miles](#b-rekraft-miles), [Val](#b-rekraft-val), [Quinn26](#b-rekraft-quinn26), [Noah34](#b-rekraft-noah34)

------------------------

Mulige forbedringer av billedhåndtering og bildeoptimalisering
Xander31 peker på at appen laster jpg-bilder for hver sang, noe som tar ressurser. Han foreslår å vurdere base64-encoding som et alternativ hvis det gir bedre ressursutnyttelse, og at det kan være en mulig implementering hvis tid tillater det. Noah34 legger til at lazy loading og progressive bilder kunne styrke bærekraften utover de tekniske gevinstene. Dette berører hvordan bilder håndteres i sangkatalogen og kan påvirke både lastetid og nettverksbruk. En grundig evaluering av fordeler og ulemper ved base64 versus separate bildefiler bør gjøres før eventuell implementering, og eventuelle endringer bør testes for ytelse. 
Reviewer(s): [Xander31](#b-rekraft-xander31), [Noah34](#b-rekraft-noah34)

------------------------

Bedre tilgjengelighet og lesbarhet i sangnavn-teksten
Teksten under sangnavnet kunne hatt bedre farger for å stå litt mer ut og være enklere å lese for svaksynte, ifølge Xander31. Dette faller direkte under UI-design og tilgjengelighet, og påvirker hvor brukervennlig appen er for personer med nedsatt syn. En mulig løsning er å justere tekstfarger og kontrast i området rundt sangnavnet, og å teste lesbarheten under ulike bakgrunner og skjerminnstillinger. 
Reviewer(s): [Xander31](#b-rekraft-xander31)

---

## Bruk av kunstig intelligens

Solid KI-dokumentasjon, men rom for bredere utnyttelse
KI-bruken i prosjektet er dokumentert i README under «Documentation of AI usage» og beskriver tydelig hvilke verktøy som er brukt og hvilke oppgaver KI har bidratt til. Flere reviewer roser at bruken virker kontrollert og moden, ikke tilfeldig eller automatisert på oppgaven. Samtidig peker de på forbedringsområder der KI kunne hatt større avtrykk, som enhetstester for player-state og sortering, automatisert kommentargenerering for GraphQL-skjema og resolvers, og automatisk CSS-refaktorering. Noen kommenterte også muligheten for KI til å hjelpe med å generere README og optimalisere koden for bedre søk og filtrering. Samlet oppfattes dokumentasjonen som god og i tråd med kravene, men de nevnte forbedringene gir rom for mer effektiv bruk av KI fremover.
Reviewer(s): [Jack](#bruk-av-kunstig-intelligens-jack), [Noah34](#bruk-av-kunstig-intelligens-noah34), [Miles](#bruk-av-kunstig-intelligens-miles), [Xander31](#bruk-av-kunstig-intelligens-xander31), [Val](#bruk-av-kunstig-intelligens-val), [Quinn26](#bruk-av-kunstig-intelligens-quinn26), [Max](#bruk-av-kunstig-intelligens-max)

Muligheter for bredere KI-bruk til tekniske forbedringer
Flere kommentarer peker på potensialet for å utvide KI-bruken til tekniske forbedringer utover dokumentasjon. Jack, Xander31 og Val foreslår konkrete bruksområder som enhetstesting av player-state og sortering, automatisert kommentargenerering for GraphQL-skjema og resolvers, samt automatisert CSS-refaktorering. Slike tiltak kan øke effektiviteten og bidra til bedre kodekvalitet, spesielt i testdekning og UI-vedlikehold. Quinn26 antyder at noen områder, som commit-meldinger, kanskje bør håndteres av mennesker for å bevare kontekst og presisjon. Overgangen til mer KI-støtte bør balanseres mot behovet for å bevare kontroll og forklarbarhet i endringer.
Reviewer(s): [Jack](#bruk-av-kunstig-intelligens-jack), [Xander31](#bruk-av-kunstig-intelligens-xander31), [Val](#bruk-av-kunstig-intelligens-val)



---

## Tekniske valg

**Store komponenter og behov for bedre strukturering**  
NowPlayingFooter og Filter blir svært store komponenter, noe som gjør koden vanskelig å vedlikeholde og teste. Både Miles og Quinn26 peker på dette som et område hvor arkitekturen kunne vært bedre, og de anbefaler at funksjonaliteten deles opp i mindre komponenter eller moduler for tydeligere ansvar. Dette påvirker vedlikeholdbarhet og risiko ved videreutvikling, særlig når applikasjonen vokser eller endringer kommer. En løsning kan være å bryte ned store komponenter til mindre, mer fokuserte enheter og vurdere behovet for å eksportere props i enkelte tilfeller.

Reviewer(s): [Miles](#tekniske-valg-miles), [Quinn26](#tekniske-valg-quinn26)


**Stil og konsistens i UI og styling**  
Noah34 og Xander31 peker på behov for bedre konsistens i styling. Noah34 nevner at et UI-bibliotek kunne bidra til mer konsistens, selv om CSS-en i dag fungerer bra. Xander31 påpeker at den delte styling er uensartet og bør fikses. Dette kan påvirke brukeropplevelsen og gjøre vedlikehold av stiler mer krevende over tid. En mulig løsning er å standardisere UI-komponentbibliotek og stylingpraksis, eller innføre et felles tema som gir konsistens på tvers av komponentene.

Reviewer(s): [Noah34](#tekniske-valg-noah34), [Xander31](#tekniske-valg-xander31)


**Sikkerhet og personvern knyttet til bruker-ID i localStorage**  
Xander31 peker på at bruker-ID lagres i localStorage og at dette gir potensielle sikkerhetsproblemer. Ved å endre ID-en manuelt i localStorage får man tilgang til den valgte brukerens spillelister, noe som viser at denne tilnærmingen ikke er robust sikkerhetsmessig. Selv om det kanskje ikke er kritisk for prosjektets omfang, representerer det en risiko for data og tilgang. En potensiell løsning er å innføre riktig autentisering og serverbasert sesjonshåndtering, eller i det minste begrense hva som kan leses/endrees fra klienten og unngå å stole på klientstyrt ID.

Reviewer(s): [Xander31](#tekniske-valg-xander31)


**Enklere oppsett og kjøring av prosjektet**  
Noah34 foreslår å gjøre oppsettet enklere ved å ha kjørbare konfigurasjonsfiler (f.eks. JSON-filer) i prosjektroten slik at man kan kjøre prosjektet direkte fra roten uten å cd’e inn i frontend- eller backend-kataloger. Dette vil redusere onboarding-friksjon og gjøre det enklere for nye bidragsytere. Forslagene inkluderer å tilby klare run-scripts eller en enkel monorepo-/wrapper-løsning som gjør det mindre avhengig av prosjektstruktur. Den typen forbedringer vil sannsynliggjøre raskere oppstart og mindre konfigurasjonsarbeid for nye utviklere.

Reviewer(s): [Noah34](#tekniske-valg-noah34)


**Robusthet og caching i datahenting**  
Miles peker på at valget av Apollo for Playlists og mutasjoner er solid, og at refetchQueries bidrar til konsistens. Likevel anbefaler han å gjøre søk og topplister som bruker graphqlFetch og AbortController mer robuste, og han påpeker manglende memoization rundt fetch og potensielle svakheter i enkelte løsninger (som en nevnt global link-hijack). For å forbedre kan man legge til caching/memoization, forbedre feilbehandling og gjøre fetch-løsningene mer robuste, eventuelt ved å konsolidere dem med Apollo-caching der det er mulig.

Reviewer(s): [Miles](#tekniske-valg-miles)

---

## Kodekvalitet

**Ryddighet og modularitet: for lange komponenter og samlet CSS/Styling**  
Det er tydelig at prosjektet har god struktur og gjenbruk, men flere komponenter er ganske lange (for eksempel SongSearch.tsx rundt 500 linjer) og mye av stilen ligger i store fellesfiler. Noen inline-stiler blir også brukt, noe som indikerer at styling ikke alltid er optimalisert for gjenbruk. Dette kan gjøre koden vanskelig å lese og vedlikeholde, særlig når prosjektet vokser. Forslagene som framkom er å bryte ned lange komponenter til mindre sub-komponenter, trekke ut filterlogikk i egne hooks/moduler, og flytte styling til mer modulære filer eller separate CSS/SCSS-løsninger for bedre konsistens og vedlikehold. Dette ble nevnt av Miles, Quinn26 og Noah34 som forbedringspunkter, selv om den overordnede arkitekturen får ros.

Reviewer(s): [Miles](#kodekvalitet-miles), [Quinn26](#kodekvalitet-quinn26), [Noah34](#kodekvalitet-noah34)

----------------------------------------

**Ustrukturert mappe-struktur: dupliserte prosjektmapper**  
Xander31 peker på at det finnes to «prosjekt2»-mapper etter hverandre i frontend som virker litt rart, selv om det ikke skaper direkte problemer i dag. Dette kan skape forvirring og gjøre navigasjon i koden mindre intuitiv over tid. En ryddig og konsistent mappestruktur vil gjøre det enklere å finne og vedlikeholde funksjonalitet. En løsning er å fjerne den doble mappestrukturen og sikre en enhetlig plassering av frontend-prosjektets filer.

Reviewer(s): [Xander31](#kodekvalitet-xander31)

----------------------------------------

**Duplisering av UI-knapper: behov for felles komponent for sjanger og artist**  
Quinn26 påpeker at knappene for sjanger og artist er veldig like og kunne brukt samme komponent. Dette er et eksempel på UI-duplisering som kan gjøre vedlikeholdet mer arbeidskrevende hvis stiler eller logikk divergerer senere. En felles, gjenbrukbar komponent (for eksempel en generisk knapp/chip) som brukes på tvers av filene, vil forbedre konsistensen og redusere vedlikeholdsarbeidet.

Reviewer(s): [Quinn26](#kodekvalitet-quinn26)

----------------------------------------

**Inkonsekvent plassering av spørringer og navnekonvensjoner**  
Max peker på at enkelte GraphQL-spørringer blir brukt direkte i UI-koden (som Home.tsx) i tillegg til andre i filter.tsx, og foreslår å samle spørringene i en queries-mappe. Han nevner også konsekvensen av inkonsekvent navngivning (PascalCase vs camelCase) og CSS-filnavn, som kan skape forvirring. Å flytte alle spørringer til en sentral queries-mappe og etablere en felles navnekonvensjon vil sannsynligvis forbedre konsistensen og enklere vedlikehold av koden.

Reviewer(s): [Max](#kodekvalitet-max)

---


# Original Feedback

## Tilgjengelighet

<a id="tilgjengelighet-jack"></a>
**Reviewer Jack:**

> Jeg har kjørt Lighthouse og prosjektet scorer 100 i Performance og 100 i Accessibility. Det betyr ikke bare at den “lastes raskt”, men at faktiske valg de har gjort i implementasjon er veldig effektive: de overfører svært små datamengder pr. request \(kun metadata, ingen tunge assets\) og prosjektet har nesten ingen unødvendig blocking-JS eller ressursbruk i UI.
> 
> Apollo Client caching hjelper også med å ikke hente samme data flere ganger → dette har stor bærekraftverdi fordi det reduserer unødvendig nettverkstrafikk over tid.
> 
> Bildebruk er også fornuftig: de bruker små thumbnails \(100px varianter fra iTunes\), ikke gigantiske høyoppløste bilder. Det er et bevisst og smart valg for energieffektiv overføring, og dette er nøyaktig slik profesjonelle tjenester gjør musikk browsing.
> 
> Den eneste \(lille\) forbedringsmuligheten som Lighthouse nevner er at cache lifetimes kan justeres på enkelte assets, men dette er marginelt og har mest betydning hvis man har veldig høy trafikk og mye tilbakevendende bruk.
> 
> Ved praktisk bruk med tastatur alene, oppleves navigasjon ikke like god. Det er mange elementer som er klikkbare \(kort / cards / listeelementer\), men som ikke alle har tydelig tab‐fokus eller er bundet opp til <a> / buttons som gir forutsigbar fokusrekkefølge.

<a id="tilgjengelighet-noah34"></a>
**Reviewer Noah34:**

> Applikasjonen har en imponerende grunnleggende implementering for tilgjengelighet med semantisk HTML, gode ARIA attributter og tydelig tastaturnavigasjon. Bruken av aria-live, aria-labelledby og focus-synlige stiler viser forståelse for WCAG-prinsippene, og bildehåndteringen med beskrivende alt-tekster er solid. Det mangler littegran skip links, kontrasttesting og en eksplisitt WCAG vurdering, noe som kunne styrket det hele .. men dette var veldig veldig bra synes jeg. 

<a id="tilgjengelighet-miles"></a>
**Reviewer Miles:**

> Når jeg bruker Google lighthouse på siden deres får dere en veldig bra score:
> 
> 100
> Performance
> 100
> Accessibility
> 79
> Best Practices
> 90
> SEO
> 
> 
> 
> Dere blir trukket ned på best practice fordi dere bruker http ikke https \(MEN dette er ikke relevant for oss, fordi vi har blitt bedt om å bruke HTTP.\) Ser du bort i fra dette ville dere fått en score på 100 \(antaglivis\). 
> 
> SEO er på 90, dette fordi "Document does not have a meta description". Som er et element som gir en oppsummering av sidens innhold og søkemotorer som brukes ved søking.
> 
> 
> Annet enn dette er kjerneflowen \(søk, nå-spilles\) har gode aria-etiketter og tastatursnarveier, men egne dropdowns/menyer mangler fousstyring og bryter semantikk, og global link-hijack + hardkoded navbar.posisjon gjør navigasjons/kb-fokus uforutsigbart.
> 
> Fiksere dere dette ligger dere på et høyt nivå.

<a id="tilgjengelighet-xander31"></a>
**Reviewer Xander31:**

> Kan bruke "tab" knappen til å navigere seg ganske bra. Kan derimot ikke bruke tab for å velge typen sortering eller filtrering, men dette er små pirking.
> 
> kan også bruke piltastene til å bytte på sangen som spilles av. Google lighthouse sa at nettsiden var perfekt med Accessibility, men ville nok selv fortsatt byttet på teksten om artisten under selve sang navnet.
> 
> Den har aria labels som gjør at blinde folk kan ta nettsiden i bruk. Den tilpasser seg også etter hva komponentet fylles med, som gjør det enda bedre. for eks: "{`Play ${t.trackName} by ${t.artistName}`}".
> 
> Generelt bra jobbet med tilgjengelighet kravene.
> 
> 

<a id="tilgjengelighet-val"></a>
**Reviewer Val:**

> Ifølge Google Lighthouse er applikasjonens tilgjengelighet på 100. Dette gjør den brukervennlig for en stor variasjon av brukere.
> 
> Applikasjonen har tydelig kontrast mellom bakgrunn, tekst og elementer slik at alt er lett leselig og godt synlig. 
> 
> Man kan også navigere siden med tastatur og skjermleser.
> 
>  Det er brukt semantiske HTML-tagger som <main>, <header>, <nav> og <section> og ARIA-merking der det trengs.

<a id="tilgjengelighet-quinn26"></a>
**Reviewer Quinn26:**

> Dere bruker lite div og span, og siden kan lett navigeres med tastatur. Dere har også tatt bruk av aria label i flere steder for å hjelpe med støtte for skjermleser.

<a id="tilgjengelighet-max"></a>
**Reviewer Max:**

> Når det gjelder tilgjengelighet så er det mulig å bla opp og ned med piltastene ved sortering hvor man kan velge hva man ønsker å sortere på, men inne på filter og genre går det ikke an å velge med piltaster. Piltastene til høyre/venstre fungerer bare som å bytte mellom sanger. Ser ellers at det er god bruk av "aria-labels" fortsett med dette for å sikre god tilgjengelighet og se over at bruken er like god i alle componenter/pages. 

---

## Funksjonalitet

<a id="funksjonalitet-jack"></a>
**Reviewer Jack:**

> Brukeropplevelsen i denne applikasjonen ligger på et godt nivå. Det er flere interaktive elementer som er løst over gjennomsnittlig bra som..
> 
> - søket gir tydelig feedback \(result count + results\)
> 
> - sort og filtrering er integrert i samme linje og gir et opplevd profesjonelt og samlet “discovery UI”
> 
> - keyboard navigation i “Now playing” footer er et meget sterkt grep
> 
> Disse valgene viser at gruppen har bevisst designet for “flow” etter søk → oppdag → spill av.
> 
> I tillegg virker denne arkitekturen skalerbar: siden de allerede proxy’er iTunes API via egen backend, kan man i praksis skru på caching / rate limiting / data enrichment på serversiden senere.
> 
> Det jeg savner litt:
> 
> - typeahead / forslag mens man skriver \(Autocomplete\)
> 
> - debouncing av søk \(umiddelbar typing trigger ikke spørring; søk er koblet til “Submit” knapp\)

<a id="funksjonalitet-noah34"></a>
**Reviewer Noah34:**

> Jeg liker det at du faktisk kan spille av musikk! Det er flere "database" type prosjekter som bare er informasjon, men det er et nice touch dere har.. det er også ganske vanskelig å få til har jeg hørt \(så bra jobba her!\). Søkefunskjonen deres funegrer også som den skal, og jeg liker spesielt at filtreringsopsjonene er basert på hva hva du har søkt på allerede.. slik at den ikke har 50 muligheter når det egentlig bare lønner seg å velge mellom to. Det er også en bra ting at spillelisten lagres til localstorage, i og med at dere ikke har noen form for innlogging. 
> 
> Noen ting som kan forbedres med tanke på funksjonalitet er for eksempel at siden kræsjer når du refresher mens du er inne på en spilleliste. Det kunne også vært kult med litt flere komponenter \(for eksempel at du kan like en artist eller "abonnere" på noen..\). Det dere har fungerer, men litt flere kule knapper kunne gjort siden mer spennende.

<a id="funksjonalitet-miles"></a>
**Reviewer Miles:**

> Det som er godt løst: 
> Jeg liker at søkeresultatene bruker samme "kort"-komponent og sørger for nyttig aria-busy samt aria-label på play knapper. Så tilgjengligheten er bedre enn man ofte ser på profesjonelle applikasjoner. Now-playing-panelet eksponerer tastatursnarveier \(spacebar og arrow keys\) og sørger for at bare en sang kan spille om gangen ved å stoppe andre previews. Moden løsning og er bedre enn andre apper jeg har sett på.
> 
> Man kan ikke søke/sortere/filtrere seg til 0 søk. Dette er godt løst
> 
> Forbedringspotensiale:
> 
> Det er Ikke en funksjon for å slette en playlist \(eller om det er det, ikke en veldig intuitiv måte å gjøre det på\). Dette kan være fint å få implementert. Samtidig er det også mulig å spam-klikke "create" og få duplikater uten hint om hva som skjer.
>  Hver gang man gjør et nytt søk nullstilles, alle filterene. 
> I AppShell.tsx har dere en global dokument-lytter som kaprer alle lenker i stedet for å buke <Link>.  
> 
> 
> Filter og søkesekjsonen gir et godt førsteinntrykk, og now playing-baren er også fin og godt løst. Med et par små justeringer rundt tilgjenglighet, state-håndtering og formfeedback har dere et UI som nærmer seg profesjonelle applikasjoner. 

<a id="funksjonalitet-xander31"></a>
**Reviewer Xander31:**

> Når siden først lastes inn, så er det ingen resultater. Kan heller ikke legge på filtrene før man får resultater. Siste søk lagres ikke. Hvis jeg går til "Playlists" for å lage en, og så gå tilbake for å legge til sangen, så må jeg søke og legge til filtrene pånytt.
> 
> Prosjekt beskrivelsen sier også at man skal ha mulighet for se mer detaljer av hvert av objektene. Dette manger per nå fra nettsiden. Kanskje en ide å legge til en "play" knapp på hver sang, mens resten av objektet kan man trykke på for å få opp mer informasjon?
> 
> Når man filtrerer, så kommer artisten/sjangeren opp 2 ganger? Liten bug som må fikses
> 
> Ellers vil jeg si meg veldig imponert. Sangen fortsette å spille selv om man navigerer seg rundt på nettsiden. Det spilles automatisk flere sanger, når den blir ferdig. Spillelisten får en bilde fra sangene man har lagt til. Kan laste inn flere resultater.
> 
> Kan heller ikke legge til spillelister med samme navn. Bra jobba.
> 
> Kan heller ikke filtrere meg til 0 svar. Også veldig bra å ha fikset
> 
> Foreleseren nevnte til oss at han liker kompleksitet, så tror det kan være en ide å legge til mer kompleks filtrering, hvis man virkelig skal sikte på en A.
> 

<a id="funksjonalitet-val"></a>
**Reviewer Val:**

> Valgene og løsningene som er gjort med tanke på de interaktive elementene viser fokus på brukervennlighet og enkel navigasjon.
> 
> For eksempel har de elementer som søkefelt på midten, filtrering under og avspillingskontroller nederst. Dette har stor likhet til det brukere er vant til fra profesjonelle applikasjoner.
> 
> Søkefunksjonen er intuitiv og gir mulighet på å søke på både sang og artist. Dette kunne funket bra, men med tanke på at det er en egen filtrering for artister, hvor man kan søke på de, hadde det kanskje gitt mer mening å bare kunne søke på låtnavn.
> 
> Løsningen virker skalerbar i designet på grunn av blant annet lett gjenbrukbare komponenter.
> 
> Løsningene er ikke triviell, men heller ikke veldig utfordrende.

<a id="funksjonalitet-wendy"></a>
**Reviewer Wendy:**

> Alt ser veldig fint ut! Alt fungerer omtrent som man tror det ville gjort dersom man er vant med andre musikkstrømmetjenester. Det å lage spillelister og legge til sanger er en smertefri opplevelse, og det er fint å kunne sortere etter artist og sjanger. Hvis jeg skulle ønsket meg en ting hadde det vært at noen sanger lastet inn til å begynne med, slik at man ikke blir møtt med en blank nettside. I tillegg hadde det vært fint om man forsøker å legge til en sang uten å ha en spilleliste, ble promptet om å lage en ny spilleliste og automatisk legge til sangen i den.

<a id="funksjonalitet-quinn26"></a>
**Reviewer Quinn26:**

> Det burde kanskje være mulig å legge til i en default spilleliste hvis ingen er laget enda. Lignende applikasjoner villle også ha brukere der man kan lagre spilllelisten sin og få tilgang fra andre enheter. Fint at dere lar brukeren bla gjennom alle sanger som passer søk men bare viser de første til å starte med.

<a id="funksjonalitet-max"></a>
**Reviewer Max:**

> Gruppen har fint løst de tekniske funksjonelle kravene med fungerende søk, filtrering og sortering i applikasjonen. Jeg synes dere har løst det veldig fint med oversikten over sanger og artister når jeg søker, det er en fin oversikt over alle sangene. Det er fint med feedback når du "hover" over sangene og veldig tydelig at "+" tegnet er for å legge til en sang i en spilleliste. Det er noen småting jeg ønsker å poengtere etter å ha testet ut applikasjonen deres som jeg tror vi styrke brukeropplevelsen:
> - Hvis jeg som bruker søker "Ha" og trykker søk, også er det i resultatetene: #, &, @, alle andre tegn før det kommer ned til sang eller artist som starter med Ha. Ville ha gjort en prioritering i søkefunksjonaliteten deres slik at det blir gjort om, ser at det er skrevet i dokumentasjonen som en obs om at den er sensitivt på de tegnene og tall først, men når jeg som bruker søker etter "Ha" er det forventet at jeg får artister eller sanger med "Ha" først. 
> - Inne på oversikt over mine spillelister: Gjerne legg til funksjonalitet til å slette en spilleliste som er kjekt å ha hvis jeg skriver feil navn eller ikke ønsker å ha listen lengre. Eventuelt legge til mulighet for å endre tittel på spillelisten.
> - Det er veldig tydelig at man kan legge til en sang i en spilleliste, men litt mindre tydelig at når du klikker ellers på elementet så spiller du av sang, er det mulig å ha med en play-button for å gjøre det mer tydelig?

---

## Design og utforming

<a id="design-og-utforming-jack"></a>
**Reviewer Jack:**

> Designet er estetisk gjennomført og tydelig inspirert av moderne streaming-/musikkapper. Mørk palett, hvit typografi og klare kontrastfarger på interaktive elementer gir et profesjonelt uttrykk. Fontvalg og typografisk hierarki virker bevisst. Overskrifter er tydelige, og spacing/marginer mellom komponenter gir ro og luft.
> 
> Plassering av elementer er logisk: søkefeltet er sentralt og først i visuell prioritet, med sortering og filtrering umiddelbart tilgjengelig i samme “viewport”. Dette gir også god “information scent” for brukeren \(bruker skjønner intuitivt at dette er discovery/utforsking\).
> 
> Bruken av albumcover-bilder fungerer visuelt godt og er godt integrert i grid/list designet. Det ser ikke tilfeldig ut, men konsekvent. Det gir også umiddelbart gjenkjenningspunkt for bruker.
> 
> Jeg har testet layouten på smalere skjerm, ingenting kollapset eller klippet. Men den er ikke helt responsive for mobiler. Jeg må bla bortover på siden, da skjermen ikke blir croppet for mobil. Den fungerer dog fint på pc!

<a id="design-og-utforming-noah34"></a>
**Reviewer Noah34:**

> Siden deres er intuitiv, men kanskje litt kjedelig? Jeg liker at dere har fått opp logo og navn i taben, det er kult! Dere har jo en fargepalett som dere holder dere til.. men det er ikke alltid at dette kommer frem like sterkt som det kunne ha gjort, spesielt siden applikasjonen deres ikke fyller opp hele skjermen til tider. Så langt jeg kan se så vil denne fungere greit på mobiltelefoner også.. dere har mange breakpoints og det er mye som reorganiserer seg \(vil jo selvfølgelig ikke se like bra ut som på storskjerm, men fortsatt innafor\). 
> 
> Jeg tror det hadde vært kult hvis dere var litt mer elektriske med fargebruken deres, ikke vær så sjenert! Det er jo en musikk app, så til og med å ha noen kule effekter og musikk-relaterte animasjoner hadde vært tipp toppers. Lag "TuniIn" logoen til noe kult og spennende også, det hadde vært bra. 

<a id="design-og-utforming-miles"></a>
**Reviewer Miles:**

> UI-en har et tydelig mørkt tema, samt rikelig med luft rundt blokker som home-columns og spillerkortene. Fargebruken er konsekvent, og siden ser estetisk bra ut. Illusatrsjonenen \(bilder og den slags\) øker det estetiske uten å stjele for mye fokus. Bra jobba!
> 
> Det er likevel noen forbedringspunkter. NavBar-knappen er hard posisjoner med med "margin-left:60%" og slutter raskt å sentrere seg selv på mindre skjermer. Filterkontrollen har derimot fast bredde via "--filter-control-width",  som først brytes vde 740px.
> 
> Resten av appen har gode responsive tweaks. Toppsporet og dropdowns skalerer, så opplevelsen kollapser ikke. 
> 
> Kort sagt er mikro-layout og appen er visuellt soild. Endre på et par enkelte hardkodede posisjoner og bredder for å få en bedre fleksilbilitet. 

<a id="design-og-utforming-xander31"></a>
**Reviewer Xander31:**

> På mobilen, så ser det greit ut, men knappen som gjør at du kan legge en sang til en spilleliste går utenfor skjermen.
> 
> Det ser ut som om komponente som har informasjon om sangen, har en statisk lengde som gjør at den ikke klarer å forandre seg godt i forhold til skjermen. Leder til noen problemer her og der.
> 
> På mobile view, så er også "playlist" knappen helt inntil logoen.
> 
> Ellers så er fargene bra for svaksynte og fargeblinde, så dette er bra.  

<a id="design-og-utforming-val"></a>
**Reviewer Val:**

> Applikasjonene har et moderne og ryddig design med god kontrast mellom bakgrunn og tekst/elementer.
> 
> Den har et gjengående fargetema med rosa ikoner og hvit tekst mot mørke svart, grå og blå bakgrunnsfarger. 
> 
> Fonten fungerer godt med det minimalistiske designet og det er nok med "whitespace" mellom elementene.
> 
> Både hjemmesiden og spillelistesiden er i stor grad responsiv, men siden for en spilleliste du har laget, blir strekt ut av låtene slik at navbaren ikke dekker bredden. I tillegg vil lange låtnavn gå over de rosa ikonene.

<a id="design-og-utforming-wendy"></a>
**Reviewer Wendy:**

> Stilen er ganske minimal, men det funker helt fint. Ser ganske sleek og fint ut. Når jeg ser på siden på enkelte mobilskjermstørrelser i chrome devtools \(IPhone SE, Galaxy Z fold 5\) så overlapper knappen til hjemsiden og spillelistene. Dette er mulig å komme seg rundt, men trekker litt fra den helhetlige opplevelsen.

<a id="design-og-utforming-quinn26"></a>
**Reviewer Quinn26:**

> Ting som filter og valg av sjanger passer ikke med stilen til resten av siden. Sanger kan gå av skjermen og knappene på header kan gå oppå hverandre for skjermer som er ikke noe uvanlig små. Ikke alle knapper er er på rett linje, sortering og filtrering på liten skjerm.

<a id="design-og-utforming-max"></a>
**Reviewer Max:**

> Dere har en fin applikasjon og selve utformingen av designet er behagelig for bruker i form av farger og elementer. Selve hovedsiden kan virke litt «tom» ettersom det ikke vises noen sanger før man har gjort ett søk. Dette kan løses ved å eventuelt ha noen «randomme» sanger som ligger som eksempel fra start - om dette vil gi mening i tråd med dere visjon selvfølgelig. 
> Noen små pirk/tips:
> - Streken som skiller mellom filter/sortering/søk og oversikten over låter er kortere enn plassen disse elementene tar, gjerne se over denne slik at den er like lang som innholdet over ved å enten justere størrelsen på knappene over eller linjen. 
> - Når det gjelder design er det behagelige farger i applikasjonen, men det er generelt lite forskjell på darkmode/lightmode og appen blir veldig mørk. Ville ha prioritert å gjøre lightmode litt lysere slik at bruker merker en betydelig forskjell. Hvertfall være oppmerksom at noen har systempreferanser light og noen dark og dermed er det lurt å ta hensyn til i fargevalg for begge system.
> - Det er gjort gode justeringer allerede for responsivt design, men ville ha sett over dette en gang til før siste innlevering for å sikre at alle elementer \(knapper og dropdown\) justerer seg. 
> - Nå er det mye rom mellom filtering mellom All Artists og All genres, disse kunne vært tettere på hverandre eller legge til "Filter by" til All genres også. 

---

## Bærekraft

<a id="b-rekraft-jack"></a>
**Reviewer Jack:**

> Gruppen har valgt flere løsninger som er gode sett fra et bærekraftperspektiv:
> 
> - de streamer kun metadata + små thumbnails fra iTunes \(i stedet for store bilder / video / tunge assets\)
> 
> - de cache’r data via Apollo Client slik at samme data ikke lastes om og om igjen \(mindre nettverk, lavere ressursbruk\)
> 
> - de laster kun det som trengs inn i UI’et \(ikke bulk‐import av store datasett\)
> 
> - I tillegg bruker de mørkt tema, som \(på OLED/AMOLED\) faktisk er energireduksjon i praksis.
> 
> Gruppen har valgt løsninger som både er robuste og effektive. De har tenkt riktig rundt datamengde, caching og bildebruk. Dette er i tråd med moderne “lightweight” webapplikasjonsdesign og kan anses som bærekraftig valg.

<a id="b-rekraft-noah34"></a>
**Reviewer Noah34:**

> Her har vi flere gode bærekraftstiltak, som caching med Apollo Client, debounce på søk, bruk av systemfonter og en proxy-løsning som reduserer API-trafikk. Bildehåndteringen er også godt optimalisert med små formater og effektiv CSS-bruk. Likevel mangler det litt bærekraft utover de tekniske gevinstene.. lazy loading, progressive bilder kunne gjort dette punktet enda sterkere. 

<a id="b-rekraft-miles"></a>
**Reviewer Miles:**

> Dokumentasjonen sier lite om bærekraft, Dette sagt er selve implementasjonen av appen relativt bærekraftig. Dere sier derimot en del om valgene dere har gjort underveis, dette er bra:\)
> 
> Eksempel på bærekraft i appen deres:
> Styling:
> Bruken av mørke farger og systemfonter holder lysstyrke nede, uten tunge bakgrunnsbilder eller custom-fontpayloads. 
> Fetching og interaksjonen med backen er også bærekraftig. backend bruker paginerte GraphQL-spørringer \(SongSearch.tsx\) i stedet for å streame hele kataloger
> 
> Forbedring: Legg til et kort avsnitt om bærekraft i readme. 

<a id="b-rekraft-xander31"></a>
**Reviewer Xander31:**

> Blir ikke gjort unødvendige mange queries mot databasen. De loader inn jpg bilder for hver sang, som tar opp en del ressurser. Vet at det er ganske standard, men tror det er mulig å gjøre det bedre ved å ta i bruk base64 encoding. Kan hende det er noe man kan implementere hvis det viser seg at man har tid.
> 
> Teksten under sang navnet kunne kanskje hatt bedre farger for å stå litt mer ut og være enklere å lese, for svaksynte

<a id="b-rekraft-val"></a>
**Reviewer Val:**

> Gruppen har ikke forklart, men har valgt gode og effektive løsninger for bærekraft. For eksempel henter dere data fra iTunes API og mellomlagrer i en lokal PostgreSQL-database, som reduserer antall eksterne API-kall og dermed både belastning og energibruk.
> 
> Applikasjonen benytter seg av kun 30-sekunder lange lydklipp istedenfor fulle sangen, noe som begrenser datamengden, som er mer bærekraftig.
> 
> Bruken av mørke bakgrunnsfarger gjør også at siden har et mindre energiforbruk enn hvis den hadde vært lysere. Dette gjør den lett, effektiv og samtidig brukervennlig.

<a id="b-rekraft-quinn26"></a>
**Reviewer Quinn26:**

> Valg innen bærekraft er ikke forklart, men det ser ut til at dere har tenkt over det med dark mode og å laste inn bare det dere trenger.

<a id="b-rekraft-max"></a>
**Reviewer Max:**

> Valget av iTunes Search API fremstår som et strategisk og bærekraftig grep for applikasjonen slik at det er ingen behov for autentifisering eller API nøkler, 30-sekunder forhåndsvisning gir funksjonell verdi uten juridiske komplikasjoner \(viktig for bærekraftig drift\), og i tråd med valget dere gjorde ved å velge bort API-et til spotify ville krevd avtaler eller tekniske krav som kunne satt grenser på fremdriften deres. Samme med valget av å bytte fra MongoDB til postgreSQL kan man se på som et bærekraftig valg siden postgreSQL gir sterkere støtte for relasjoner og dataintegritet som er verdifullt for deres "sangkatalog" som er stabil, og mulighetene for å utvide databasen er gode. Man kan vel også dra den så langt å si at det er bærekraftig av dere som gruppe å se behovet for en slik endring og gjøre et slikt valg.

---

## Bruk av kunstig intelligens

<a id="bruk-av-kunstig-intelligens-jack"></a>
**Reviewer Jack:**

> Gruppen har dokumentert bruk av generativ KI godt og transparent i README. De oppgir konkret når KI er brukt \(debugging, boilerplate, docstruktur\) og hva som er egen kompetanse vs. assistanse fra verktøy. Dette er en moden måte å bruke KI på, som arbeidsstøtte, ikke som “løs oppgaven for oss”.
> 
> Samtidig: basert på kompleksiteten de har implementert \(Apollo cache, GraphQL resolvers, player‐context med keyboard‐bindings\) , er det tydelig at gruppen faktisk forstår teknologien de bruker. Koden bærer preg av systematisk struktur og gjennomtenkt design, ikke “auto-generert fragmenter”.
> 
> Det er likevel områder hvor KI kunne vært brukt mer effektivt, f.eks:
> 
> - generering av enhetstester \(Vitest / RTL\) for player‐state og sorting
> 
> - automatisert kommentargenerering for GraphQL schema/resolvers
> 
> - automatisk CSS‐refaktorering \(de skriver selv at dette er ett punkt de ønsker å forbedre\)

<a id="bruk-av-kunstig-intelligens-noah34"></a>
**Reviewer Noah34:**

> Ikke abre er KI dokumentert på en oversiklig måte, men jeg synes at hele READMEen følger samme stil. Ale er forklart tydelig og klart, samt bruk av KI. Dere har brukt KI til å sette opp forskjellige deler av prosjektet + for å få inspill ser det ut som. Dette er veldig bra bruk! Jeg synes det ser ut som dere har stålkontroll akkurat her. Nice!

<a id="bruk-av-kunstig-intelligens-miles"></a>
**Reviewer Miles:**

> Dere har en egen seksjon i readme “Documentation of AI usage” som lister ChatGPT 5, Copilot og Claude, hva de ble brukt til \(setup, debugging, boilerplate, mockdata, docs, issues/commits\) og at alt ble reviewet i GitHub. 
> 
> Fint å se at dere er ærlige når det kommer til bruk av AI!
> 
> Alt i alt er bruken av AI iht kravene og dere har gjort en god jobb!

<a id="bruk-av-kunstig-intelligens-xander31"></a>
**Reviewer Xander31:**

> De har brukt KI. Hva de har brukt KI til er også godt dokumentert og forklart. De har brukt det til en rekke forskjellige oppgaver. Visste for eksempel ikke at KI kunne skrive commit meldinger. Med tanke på at de har brukt KI til nesten hva som helst, så er det få ting jeg tenker de kunne brukt mer KI til for å gjøre noe mer effektivt.
> 
> Kunne kanskje brukt KI for å lage readme filen, siden jeg prøve meg på "touch backend/.env", men dette fungerte ikke. Lagde heller bare filen med vanlig høyreklikk.

<a id="bruk-av-kunstig-intelligens-val"></a>
**Reviewer Val:**

> Gruppen har brukt generativ KI og dokumentert dette godt. Dere har brukt både ChatGPT, Copilot og Claude.
> 
> I dokumentasjonen forklarer dere at de har blitt brukt for oppsett av prosjektet, debugging, generering av boilerplate-kode, mockdata, forslag til dokumentasjonsstruktur og skriving av issue-beskrivelser og commit-meldinger på GitHub.
> 
> Dermed har dere god dokumentasjon for KI-bruken og forklaringer på bruken. KI kunne blitt brukt mer for å optimalisere koden og forbedret søk og filtrering.

<a id="bruk-av-kunstig-intelligens-quinn26"></a>
**Reviewer Quinn26:**

> Bruk av KI er godt dokumentert og valgt brukt i deler av prosjektet som gir mening. Kanskje å skrive commit melding selv er bedre siden dere vet bedre hva dere har gjort selv enn det ki gjør. Jeg tror ikke mer bruk av ki ville gjort noe mer effektivt.

<a id="bruk-av-kunstig-intelligens-max"></a>
**Reviewer Max:**

> Fin forklaring av hva de har brukt KI til å bidra med i dette prosjektet. Ryddig. 

---

## Tekniske valg

<a id="tekniske-valg-jack"></a>
**Reviewer Jack:**

> De tekniske valgene her er gode. Gruppen bruker Apollo Client på frontend med GraphQL, og lar Apollo håndtere caching av queries. Dette er et bra valg, og det løfter kvaliteten på dataflyten sammenlignet med tradisjonell fetch + useEffect. Jeg ser også at de bruker lokale mutations og refetch for å synkronisere state etter endringer \(f.eks. flytting eller fjerning av track i playlist\). Det viser forståelse for at backend er “source of truth”.
> 
> Videre er det egne moduler for logikk \(hooks, lib, graphql\), og domenelogikk er ikke gjemt inne i komponentene. React‐koden er relativt ren, komponentene er små og SRP \(single responsibility principle\) ivaretas ganske bra.
> 
> Statehåndtering gjøres i hovedsak gjennom Apollo \(server state\) og en player context for avspillingskø og nåværende låt. Dette er god separasjon: global state brukes bare for det som faktisk er globalt.
> 
> I tillegg er det implementert debouncing av søk via egen hook, dette er et tegn på at de aktivt tenker på både ytelse og brukeropplevelse.

<a id="tekniske-valg-noah34"></a>
**Reviewer Noah34:**

> Dere viser sterke tekniske valg med Apollo Client, TypeScript, React Router og alt det der..samt en god arkitektur som skiller frontend og backend. Dere kunneogså hatt noe json filer i rota slik at dere kan kjøre prosjektet der i fra \(det var veldig deilig å slippe cd frontend og cd backend da vi fikk det til, just sayin\). Bruken av custom hooks og context er gode React-poeng, og Vite oppsettet gir en fin utviklingsopplevelse. Selv om et UI-bibliotek kunne gitt mer konsistens, fungerer CSSen godt. Dere har bra oppsett.

<a id="tekniske-valg-miles"></a>
**Reviewer Miles:**

> Apollo Client brukes konsekvent til Playlists og mutasjoner, med refecthQueries for enkel konsistens, og er et trygt og godt valg. Dere bruker en graphqlFetch og abortController for søk og topplister. Dette er en lett løsning som fungerer, men kan vurderes å gjøre mer robust. 
> Plain hooks og debounce samt en PlayerContext styrer global avspilling med keyboard hooks. Portaler brukes til Add-to-playlist-menyen for å unngå clipping. Click-outside.logikk er forseggjort. Dette viser en god forståelse av React-mønstre, selv om enkelte valgt global link-hijack, manglende memoization rundt fetch\) kunne vært strammet inn.
> 
> Alt i alt er tech-stakken dere bruken nøktern og godt forstått. Bra jobbet. For å øke nivået enda litt mer er det mulig å stramme inn ett par løsninger og gjort de litt mer robuste. \(SongSearch.tsx \(linje 436-499\) bruke bedre menymønster. Samt Filter.tsx mangler caching/memorization. 
> 
> 

<a id="tekniske-valg-xander31"></a>
**Reviewer Xander31:**

> Vil si at alle de teknologiske valgene gir mening. Det å gi en ID når de første besøker nettsiden er også en kul ide. Sjekket med flere versjoner av nettsiden og hvis jeg gikk inn på localstorage og endret manuelt til en annen id, så fikk jeg spillelistene knyttet til den brukeren sin ID jeg satte inn. Ganske kult. Sikkerhetsmessig, så er det dårlig, men er ikke viktig her.
> 
> Ellers er det blitt brukt teknologier som passer oppgaven de har fått og utnytter dem godt. Ikke noe særlig å klage på her. Må bare fikse på den 2 delte styling'en.

<a id="tekniske-valg-val"></a>
**Reviewer Val:**

> Valget av React og Typescript i frontend og Node/GraphQL i backend viser at gruppen har tenkt skalerbarhet, tekstbarhet og god oppdeling.
> 
> GraphQL gir fleksibilitet i datatilgang og effektiv kommunikasjon med databasen, samtidig som det gjør det enkelt å utvide funksjonalitet senere.
> 
> PostgreSQL som database gir gode muligheter for ytelse og dataintegritet, spesielt sammenlignet med MongoDB, som dere først prøvde dere på. 
> 
> Bruken av localStorage til å generere bruker-ID funker fint i et slikt enkelt prosjekt, hvor brukerinformasjon og slikt ikke er like viktig.
> 
> Bruken av tredjepartsbiblioteker virker også god med tanke på at de støtter sentrale funksjoner uten å skape unødvendig kompleksitet.

<a id="tekniske-valg-quinn26"></a>
**Reviewer Quinn26:**

> Jeg synes apollo er et godt valg for å sette opp graphql backend. Ting som playwright er også et godt valg for e2e. Slike valg viser god forståelse av teknologivalg. Koden kunne vært bedre strukturert noen steder, f.eks. veldig store komponenter som NowPlayingFooter og Filter. Små ting som å eksportere component props trenger ikke å gjøres.

<a id="tekniske-valg-max"></a>
**Reviewer Max:**

> Som jeg leser i dokumentasjonen har dere hentet over 7000 sanger fra iTunes sitt API og det synes jeg er en god løsning for å sikre at applikasjonen fungerer for store datasett. Det er også fin refleksjon rundt valg av database da dere måtte bytte database underveis. Når det gjelder state har dere valgt en god løsning i deres prosjekt ved å bruke lokal lagring og genere en unik bruker-id fremfor innlogging, som gjør det lett å ta i bruk applikasjonen uten å være avhengig av å logge inn samtidig som dere ivaretar muligheten til private spillelister uten å gjøre det unødvendig komplekst i backend. 

---

## Kodekvalitet

<a id="kodekvalitet-jack"></a>
**Reviewer Jack:**

> Prosjektet er strukturert på en profesjonell måte. De bruker feature‐orientert mappestruktur \(components, pages, hooks, graphql, lib\), som er best practice for React i større prosjekter. Det er lett å finne ut “hvor hører dette ansvaret hjemme?”, og det er et viktig kjennetegn på maintainable kode.
> 
> Navngivingen er gjennomgående klar og semantisk. Det fremgår tydelig hva komponenter gjør \(f.eks. PlaylistView, SongSearch, NowPlayingFooter\). Dette følger clean code‐prinsipper.
> 
> De viser også god disiplin rundt gjenbruk: <PlaylistCard> gjenbrukes samme sted i flere views uten at det dupliseres logikk. I tillegg er avspillingslogikk samlet i en PlayerContext, ikke spredt i UI, som er et godt, profesjonelt arkitekturvalg.
> 
> Koden er relativt ren og lesbar. De deler opp ansvar og logikk i mindre, forståelige deler. 

<a id="kodekvalitet-noah34"></a>
**Reviewer Noah34:**

> Kodebasen her er fint strukturert og gjennomtenkt, med tydelig mappeorganisering, strenge TypeScript-regler og god bruk av linting for kvalitet og tilgjengelighet. React-mønstrene deres er veldig sterke, med custom hooks, context og gode props-definisjoner som følger clean code-prinsipper. Det finnes bittelitt unødvendig styling og noen inline-styles, men helheten er ganske fra praksis \(fra det jeg vet om det\). 

<a id="kodekvalitet-miles"></a>
**Reviewer Miles:**

> Prosjektet er godt strukturert og er lett å sette seg inn i. Veldig bra! src/components, pages, player, hooks, styles, og graphql mapper følger vanlig konvensjon og gjør det enkelt å finne funksjonalitet. Navngivning er konsekvent \(bruke av CamelCase osv\). 
> 
> Samtidig er det noen clean code forbedringer. CSS'en ligger delvis i store felles filer, og enkelte komponenter er blitt veldig lange \(mye kode\). Eksempelvis er SongSearch.tsx ~ 500 linjer. Et tips er å bryte ned filterlogikken i egne hook/komponentmoduler. 
> 
> Altså veldig bra jobbet, bare rydd ogg i lange filer og CSS-splittingen.

<a id="kodekvalitet-xander31"></a>
**Reviewer Xander31:**

> Har delt inn i frontend og backend som er bra. Litt rart med 2 "prosjekt2" mapper etter hverandre, men skaper ikke noe problemer. Ellers vil jeg si at kodekvaliteten er bra. Ingen komponenter håndterer altfor mye logikk. Logikken i koden er ganske grei å kunne følge med på. Generelt bra. Har ikke noe å kommentere.

<a id="kodekvalitet-val"></a>
**Reviewer Val:**

> Prosjektet er godt organisert i en frontend og backend mappe. Frontend er delt i mapper for ulike components, pages, hooks, styles, graphql filer og library utilities. Backend har også en graphql mappe sammens med en src mappe.
> 
> Det er konsekvent brukt PascalCase for React-komponenter og navnene er beskrivende.
> 
> Det er god bruk av Typescript for typesikkerhet, gjenbrukbare hjelpefunksjoner og oppdeling i lokiske seksjoner.

<a id="kodekvalitet-quinn26"></a>
**Reviewer Quinn26:**

> Hadde vært ryddigere å dele opp i mindre komponenter der de går over ca 200 linjer eller der det gir mening å ha et sub-komponent. Knapper som sjanger og artist er veldig like og kunne brukt samme komponent. Store komponenter gjør også koden rotete siden variabler som defineres øverst ikke blir brukt før 500 linjer senere.

<a id="kodekvalitet-max"></a>
**Reviewer Max:**

> Prosjektet er fint delt inn i frontend og backend, med ryddige mapper og god struktur. Veldig oversiktlig og man finner det man forventer å finne i de ulike mappene, veldig bra!
> Noen småtips:
> - I Home.tsx er det en overflødig query som allerede eksisterer i queries/playlist.ts, ser det ut som i første øyekast. Dette gjelder også spørringene ARTISTS_QUERY/GENRES_QUERY inne i filter.tsx, disse kan gjerne legges innenfor queries/filter.ts.Gjerne se over at alle queries ligger inne i mappen for queries istedenfor direkte inn i en annen fil i frontend.
> - Se over å være konsekvens om dere skal navngi i form av om dere skal bruke PascalCase \(hver ord-del starter med storbokstav\) eller camelCase \(første ord med liten forbokstav og deretter nytt ord med stor bokstav\). For eksempel med css filene deres.

---


---

**Takk for at du leste tilbakemeldingene!**
Husk å fylle ut [https://nettskjema.no/a/565641]!
