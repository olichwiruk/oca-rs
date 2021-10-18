use oca_rust::state::{
    attribute::{Attribute as AttributeRaw, AttributeType, Entry as EntryRaw},
    encoding::Encoding,
    language::Language,
    oca::OCA as OCARaw,
    validator,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Deserialize)]
pub struct Entry {
    id: String,
    translations: HashMap<String, String>,
}

#[wasm_bindgen]
impl Entry {
    #[wasm_bindgen(constructor)]
    pub fn constructor(id: String, translations: &JsValue) -> JsValue {
        let translations_str: HashMap<String, String> =
            serde_wasm_bindgen::from_value(JsValue::from(translations)).unwrap();

        let mut translations_raw: HashMap<Language, String> = HashMap::new();
        for (lang, translation) in translations_str.iter() {
            translations_raw.insert(lang.to_string(), translation.clone());
        }

        serde_wasm_bindgen::to_value(&EntryRaw::new(id, translations_raw)).unwrap_or(JsValue::NULL)
    }
}

#[wasm_bindgen]
pub struct OCA {
    raw: OCARaw,
}

#[wasm_bindgen]
impl OCA {
    #[wasm_bindgen(constructor)]
    pub fn new(encoding: Encoding) -> OCA {
        OCA {
            raw: OCARaw::new(encoding),
        }
    }

    #[wasm_bindgen(js_name = "addName")]
    pub fn add_name(mut self, names: &JsValue) -> OCA {
        let names_str: HashMap<String, String> =
            serde_wasm_bindgen::from_value(JsValue::from(names)).unwrap();

        let mut names_raw: HashMap<Language, String> = HashMap::new();
        for (lang, name) in names_str.iter() {
            names_raw.insert(lang.to_string(), name.clone());
        }

        self.raw = self.raw.add_name(names_raw);
        self
    }

    #[wasm_bindgen(js_name = "addDescription")]
    pub fn add_description(mut self, descriptions: &JsValue) -> OCA {
        let descriptions_str: HashMap<String, String> =
            serde_wasm_bindgen::from_value(JsValue::from(descriptions)).unwrap();

        let mut descriptions_raw: HashMap<Language, String> = HashMap::new();
        for (lang, description) in descriptions_str.iter() {
            descriptions_raw.insert(lang.to_string(), description.clone());
        }

        self.raw = self.raw.add_description(descriptions_raw);
        self
    }

    #[wasm_bindgen(js_name = "addAttribute")]
    pub fn add_attribute(mut self, attr: &JsValue) -> OCA {
        let attr_raw: AttributeRaw = attr.into_serde().unwrap();
        self.raw = self.raw.add_attribute(attr_raw);
        self
    }

    pub fn finalize(self) -> JsValue {
        JsValue::from_serde(&self.raw.finalize()).unwrap_or(JsValue::NULL)
    }
}

#[wasm_bindgen]
pub struct Validator {
    raw: validator::Validator,
}

impl Default for Validator {
    fn default() -> Self {
        Self::new()
    }
}

#[wasm_bindgen]
impl Validator {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Validator {
        Validator {
            raw: validator::Validator::new(),
        }
    }

    #[wasm_bindgen(js_name = "enforceTranslations")]
    pub fn enforce_translations(mut self, languages: JsValue) -> Validator {
        let languages_raw: Vec<String> = serde_wasm_bindgen::from_value(languages).unwrap();

        self.raw = self.raw.enforce_translations(languages_raw);
        self
    }

    pub fn validate(self, oca: &JsValue) -> JsValue {
        #[derive(Serialize)]
        struct ReturnResult {
            success: bool,
            errors: Vec<String>,
        }
        let return_result: ReturnResult;
        let oca_raw: OCARaw = oca.into_serde().unwrap();
        let result = self.raw.validate(&oca_raw);
        match result {
            Ok(()) => {
                return_result = ReturnResult {
                    success: true,
                    errors: vec![],
                }
            }
            Err(err) => {
                let errors: Vec<String> = err
                    .iter()
                    .map(|e| {
                        if let validator::Error::Custom(msg) = e {
                            msg.clone()
                        } else {
                            "undefined error".to_string()
                        }
                    })
                    .collect();
                return_result = ReturnResult {
                    success: false,
                    errors,
                }
            }
        }

        JsValue::from_serde(&return_result).unwrap_or(JsValue::NULL)
    }
}

#[wasm_bindgen]
pub struct Attribute {
    raw: AttributeRaw,
}

#[wasm_bindgen]
impl Attribute {
    #[wasm_bindgen(constructor)]
    pub fn new(name: String, attr_type: AttributeType) -> Attribute {
        Attribute {
            raw: AttributeRaw::new(name, attr_type),
        }
    }

    #[wasm_bindgen(js_name = "setPii")]
    pub fn set_pii(mut self) -> Attribute {
        self.raw = self.raw.set_pii();
        self
    }

    #[wasm_bindgen(js_name = "addEncoding")]
    pub fn add_encoding(mut self, encoding: Encoding) -> Attribute {
        self.raw = self.raw.add_encoding(encoding);
        self
    }

    #[wasm_bindgen(js_name = "addFormat")]
    pub fn add_format(mut self, format: String) -> Attribute {
        self.raw = self.raw.add_format(format);
        self
    }

    #[wasm_bindgen(js_name = "addUnit")]
    pub fn add_unit(mut self, unit: String) -> Attribute {
        self.raw = self.raw.add_unit(unit);
        self
    }

    #[wasm_bindgen(js_name = "addLabel")]
    pub fn add_label(mut self, labels: &JsValue) -> Attribute {
        let labels_str: HashMap<String, String> =
            serde_wasm_bindgen::from_value(JsValue::from(labels)).unwrap();

        let mut labels_raw: HashMap<Language, String> = HashMap::new();
        for (lang, label) in labels_str.iter() {
            labels_raw.insert(lang.to_string(), label.clone());
        }

        self.raw = self.raw.add_label(labels_raw);
        self
    }

    #[wasm_bindgen(js_name = "addEntries")]
    pub fn add_entries(mut self, entries: Vec<JsValue>) -> Attribute {
        let mut entries_raw: Vec<EntryRaw> = vec![];
        for entry in entries.iter() {
            let e: Entry = serde_wasm_bindgen::from_value(JsValue::from(entry)).unwrap();

            let mut entry_tr_raw: HashMap<Language, String> = HashMap::new();
            for (lang, entry_v) in e.translations.iter() {
                entry_tr_raw.insert(lang.to_string(), entry_v.clone());
            }
            entries_raw.push(EntryRaw::new(e.id, entry_tr_raw))
        }

        self.raw = self.raw.add_entries(entries_raw);
        self
    }

    #[wasm_bindgen(js_name = "addInformation")]
    pub fn add_information(mut self, information: &JsValue) -> Attribute {
        let information_str: HashMap<String, String> =
            serde_wasm_bindgen::from_value(JsValue::from(information)).unwrap();

        let mut information_raw: HashMap<Language, String> = HashMap::new();
        for (lang, info) in information_str.iter() {
            information_raw.insert(lang.to_string(), info.clone());
        }

        self.raw = self.raw.add_information(information_raw);
        self
    }

    pub fn build(self) -> JsValue {
        JsValue::from_serde(&self.raw).unwrap_or(JsValue::NULL)
    }
}
