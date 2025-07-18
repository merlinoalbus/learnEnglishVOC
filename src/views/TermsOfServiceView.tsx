import React from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import { useAppContext } from "../contexts/AppContext";

export const TermsOfServiceView: React.FC = () => {
  const { dispatch } = useAppContext();

  const handleGoBack = () => {
    dispatch({ type: "SET_VIEW", payload: "main" });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            onClick={handleGoBack}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Indietro
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <FileText className="w-6 h-6" />
              Termini di Servizio
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
            </p>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Accettazione dei Termini</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Utilizzando LearnEnglishVOC ("l'App"), accetti di essere vincolato da questi Termini di Servizio. 
                Se non accetti questi termini, non utilizzare l'App.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Descrizione del Servizio</h2>
              <p className="text-gray-700 dark:text-gray-300">
                LearnEnglishVOC è un'applicazione web progettata per aiutare gli utenti a imparare il vocabolario inglese 
                attraverso test interattivi, gestione delle parole e monitoraggio del progresso.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Account Utente</h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-2">
                <p>• Devi fornire informazioni accurate durante la registrazione</p>
                <p>• Sei responsabile della sicurezza del tuo account e password</p>
                <p>• Non condividere le tue credenziali di accesso con altri</p>
                <p>• Notifica immediatamente qualsiasi uso non autorizzato del tuo account</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Uso Accettabile</h2>
              <div className="text-gray-700 dark:text-gray-300 space-y-2">
                <p>Non puoi utilizzare l'App per:</p>
                <p>• Attività illegali o non autorizzate</p>
                <p>• Violare i diritti di proprietà intellettuale</p>
                <p>• Inviare contenuti dannosi, offensivi o inappropriati</p>
                <p>• Interferire con il funzionamento dell'App</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Contenuti e Proprietà Intellettuale</h2>
              <p className="text-gray-700 dark:text-gray-300">
                L'App e i suoi contenuti originali sono di proprietà di LearnEnglishVOC e sono protetti dalle leggi 
                sul copyright. I contenuti didattici sono forniti solo per uso personale ed educativo.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Privacy e Dati</h2>
              <p className="text-gray-700 dark:text-gray-300">
                La raccolta e l'uso dei tuoi dati personali sono regolati dalla nostra Privacy Policy. 
                Utilizziamo i tuoi dati per fornire e migliorare il servizio educativo.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Limitazione di Responsabilità</h2>
              <p className="text-gray-700 dark:text-gray-300">
                L'App è fornita "così com'è" senza garanzie di alcun tipo. Non siamo responsabili per 
                eventuali danni derivanti dall'uso dell'App.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Modifiche ai Termini</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Ci riserviamo il diritto di modificare questi termini in qualsiasi momento. 
                Le modifiche saranno effettive dalla data di pubblicazione.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Contatti</h2>
              <p className="text-gray-700 dark:text-gray-300">
                Per domande sui Termini di Servizio, contattaci attraverso l'App o via email.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};