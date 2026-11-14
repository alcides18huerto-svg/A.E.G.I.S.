const EXACT: Record<string, string> = {
  "heart": "Corazón",
  "right lung": "Pulmón derecho",
  "left lung": "Pulmón izquierdo",
  "liver": "Hígado",
  "stomach": "Estómago",
  "brain": "Cerebro",
  "spinal cord": "Médula espinal",
  "spleen": "Bazo",
  "pancreas": "Páncreas",
  "right kidney": "Riñón derecho",
  "left kidney": "Riñón izquierdo",
  "urinary bladder": "Vejiga",
  "trachea": "Tráquea",
  "esophagus": "Esófago",
  "thyroid gland": "Glándula tiroides",
  "small intestine": "Intestino delgado",
  "large intestine": "Intestino grueso",
  "descending colon": "Colon descendente",
  "ascending colon": "Colon ascendente",
  "transverse colon": "Colon transverso",
  "sigmoid colon": "Colon sigmoide",
  "gallbladder": "Vesícula biliar",
  "adrenal gland": "Glándula suprarrenal",
  "aorta": "Aorta",
  "inferior vena cava": "Vena cava inferior",
  "superior vena cava": "Vena cava superior",
  "pulmonary artery": "Arteria pulmonar",
  "pulmonary vein": "Vena pulmonar",
  "diaphragm": "Diafragma",
  "cerebellum": "Cerebelo",
  "brainstem": "Tronco encefálico",
  "skin": "Piel",
};

export function partLabel(name: string): string {
  const normalized = name.trim().toLowerCase();
  if (EXACT[normalized]) return EXACT[normalized];
  for (const [english, spanish] of Object.entries(EXACT)) {
    if (normalized.includes(english)) return spanish;
  }
  return name;
}
