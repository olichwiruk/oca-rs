import { expect } from 'chai'
import util from 'util'
/*
import type {
  CharacterEncodingOverlay, ConditionalOverlay, EntryOverlay, EntryCodeOverlay, FormatOverlay, StandardOverlay,
  InformationOverlay, LabelOverlay, MetaOverlay, UnitOverlay
} from 'oca.js'
*/
import { Attribute, AttributeType, OCABox, Encoding, Validator } from 'oca.js'

describe('Plain OCA is built', () => {
  const oca = new OCABox()
    .addClassification("GICS:35102020")
    .generateBundle()
  console.log(oca)

  it('return OCA as JS object', () => {
    expect(oca).to.haveOwnProperty("said")
    expect(oca).to.haveOwnProperty("version")
    expect(oca).to.haveOwnProperty("capture_base")
    expect(oca).to.have.nested.property("capture_base.type")
    expect(oca).to.have.nested.property("capture_base.said")
    expect(oca).to.have.nested.property("capture_base.classification")
    expect(oca).to.have.nested.property("capture_base.attributes")
    expect(oca).to.have.nested.property("capture_base.flagged_attributes")
    expect(oca).to.haveOwnProperty("overlays")

    expect(oca.capture_base.attributes).to.be.an('object').that.is.empty
    expect(oca.capture_base.classification).to.eq("GICS:35102020")
    expect(oca.capture_base.flagged_attributes).to.be.an('array').that.is.empty
    // expect(oca.overlays).to.be.an('array').lengthOf(3)
  })
})

describe('OCA with attributes is built', () => {
  const oca = new OCABox()
    .addMeta("name", {
      eng: "Driving Licence",
      pol: "Prawo Jazdy"
    })
    .addMeta("description", {
      eng: "DL desc",
      pol: "PJ desc"
    })
  /*
    .addMeta("eng", "name", "Driving Licence")
    .addMeta("pol", "name", "Prawo Jazdy")
    .addMeta("eng", "description", "DL desc")
    .addMeta("pol", "description", "PJ desc")
    */
    .addAttribute(
      new Attribute("attr_name")
      .setAttributeType(AttributeType.Numeric)
      .setFlagged()
      .setLabel({
        eng: "Name: ",
        pol: "Imię: "
      })
      .setInformation({
        eng: "en info",
        pol: "pl info"
      })
      .setEntries({
        o1: {
          eng: "option 1",
          pol: "opcja 1"
        },
        o2: {
          eng: "option 2",
          pol: "opcja 2"
        }
      })
      /*
      .setUnit(MeasurementSystem.Metric, MetricUnit.Centimeter)
      .setLabel("eng", "Name: ")
      .setLabel("pol", "Imię: ")
      .setInformation("eng", "en info")
      .setInformation("pol", "pl info")
      .addUnit("SI", "cm")
      .addStandard("URN:ISO:STD:ISO:9999:-1:ED-1:V2:EN")
      .addEntryCodes(["o1", "o2"])
      .addEntryCodesMapping(["o1:op1"])
      .addEntries([
        new Entry("o1", {
          en_EN: "option 1",
          pl_PL: "opcja 1"
        }).plain(),
        new Entry("o2", {
          en_EN: "option 2",
          pl_PL: "opcja 2"
        }).plain()
      ])
      .build()
      */
    )
    .addAttribute(
      new Attribute("attr2")
      .setAttributeType(AttributeType.DateTime)
      .setLabel({
        eng: "Date: ",
        pol: "Data: "
      })
      .setEncoding(Encoding.Iso8859_1)
      .setFormat("DD.MM.YYYY")
      /*
      .addCondition("${0} == 'o1'", ['attr_name'])
      .build()
      */
    )
    .addAttribute(
      new Attribute("attr3")
      .setAttributeType(AttributeType.Reference)
      .setSai("sai")
      .setLabel({
        eng: "Reference: ",
        pol: "Referecja: "
      })
      /*
      .build()
      */
    )
    .generateBundle()

  console.log(util.inspect(oca, false, null, true /* enable colors */))

  const validator = new Validator().enforceTranslations(["eng", "pol"])
  const r = validator.validate(oca)
  console.log(r)

  describe("Capture Base", () => {
    const captureBase = oca.capture_base

    it('attributes properly added', () => {
      expect(captureBase.attributes).to.have.keys("attr_name", "attr2", "attr3")
      expect(captureBase.attributes).to.have.property("attr_name", "Numeric")
      expect(captureBase.attributes).to.have.property("attr2", "DateTime")
      expect(captureBase.attributes).to.have.property("attr3", "Reference:sai")
      expect(captureBase.flagged_attributes).to.eql(["attr_name"])
    })
  })

  /*
  describe("Overlays", () => {
    const allOverlays = oca.overlays

    describe("Meta", () => {
      const overlays = allOverlays.filter(o => o.type.includes("/meta/")) as MetaOverlay[]

      it('properly defined', () => {
        const expected: {
          [lang: string]: { name: string, description: string }
        } = {
          pl_PL: {
            name: "Prawo Jazdy",
            description: "PJ desc"
          },
          en_EN: {
            name: "Driving Licence",
            description: "DL desc"
          }
        }

        expect(overlays).to.be.lengthOf(Object.keys(expected).length)

        overlays.forEach(overlay => {
          const exp = expected[overlay.language]
          expect(exp).to.exist
          expect(overlay.name).to.be.eql(exp.name)
          expect(overlay.description).to.be.eql(exp.description)
        })
      })
    })

    describe("Character Encoding", () => {
      const overlays = allOverlays.filter(o => o.type.includes("/character_encoding/")) as CharacterEncodingOverlay[]

      it('properly defined', () => {
        expect(overlays).to.lengthOf(1)
        const overlay = overlays[0]

        expect(overlay.default_character_encoding).to.eql("utf-8")
        expect(overlay.attribute_character_encoding).to.have.keys("attr2")
        expect(overlay).to.have.nested.property("attribute_character_encoding.attr2", "iso-8859-1")
      })
    })

    describe("Conditional", () => {
      const overlays = allOverlays.filter(o => o.type.includes("/conditional/")) as ConditionalOverlay[]

      it('properly defined', () => {
        expect(overlays).to.lengthOf(1)
        const overlay = overlays[0]

        expect(overlay.attribute_conditions).to.have.keys("attr2")
        expect(overlay).to.have.nested.property("attribute_conditions.attr2", "${0} == 'o1'")

        expect(overlay.attribute_dependencies).to.have.keys("attr2")
        expect(overlay).to.nested.include({ "attribute_dependencies.attr2[0]": 'attr_name' })
      })
    })

    describe("Unit", () => {
      const overlays = allOverlays.filter(o => o.type.includes("/unit/")) as UnitOverlay[]

      it('properly defined', () => {
        expect(overlays).to.lengthOf(1)
        const overlay = overlays[0]

        expect(overlay).to.have.property("metric_system", "SI")
        expect(overlay.attribute_units).to.have.keys("attr_name")
        expect(overlay).to.have.nested.property("attribute_units.attr_name", "cm")
      })
    })

    describe("Format", () => {
      const overlays = allOverlays.filter(o => o.type.includes("/format/")) as FormatOverlay[]

      it('properly defined', () => {
        expect(overlays).to.lengthOf(1)
        const overlay = overlays[0]

        expect(overlay.attribute_formats).to.have.keys("attr2")
        expect(overlay).to.have.nested.property("attribute_formats.attr2", "DD.MM.YYYY")
      })
    })

    describe("Standard", () => {
      const overlays = allOverlays.filter(o => o.type.includes("/standard/")) as StandardOverlay[]

      it('properly defined', () => {
        expect(overlays).to.lengthOf(1)
        const overlay = overlays[0]

        expect(overlay.attribute_standards).to.have.keys("attr_name")
        expect(overlay).to.have.nested.property("attribute_standards.attr_name", "urn:iso:std:iso:9999:-1:ed-1:v2:en")
      })
    })

    describe("Entry Code", () => {
      const overlays = allOverlays.filter(o => o.type.includes("/entry_code/")) as EntryCodeOverlay[]

      it('properly defined', () => {
        expect(overlays).to.lengthOf(1)
        const overlay = overlays[0]

        expect(overlay.attribute_entry_codes).to.have.keys("attr_name")
        expect(overlay).to.have.nested.property("attribute_entry_codes.attr_name").members(["o1", "o2"])
      })
    })

    describe("Label", () => {
      const overlays = allOverlays.filter(o => o.type.includes("/label/")) as LabelOverlay[]

      it('properly defined', () => {
        const expected: {
          [lang: string]: { [attribute_name: string]: string }
        } = {
          pl_PL: {
            "attr_name": "Imię: ",
            "attr2": "Data: ",
            "attr3": "Referecja: "
          },
          en_EN: {
            "attr_name": "Name: ",
            "attr2": "Date: ",
            "attr3": "Reference: "
          }
        }
        expect(overlays).to.lengthOf(2)

        overlays.forEach(overlay => {
          const exp = expected[overlay.language]
          expect(exp).to.exist
          expect(overlay.attribute_labels).to.have.keys("attr_name", "attr2", "attr3")
          expect(overlay.attribute_labels).to.have.property("attr_name", exp["attr_name"])
          expect(overlay.attribute_labels).to.have.property("attr2", exp["attr2"])
          expect(overlay.attribute_labels).to.have.property("attr3", exp["attr3"])
        })
      })
    })

    describe("Information", () => {
      const overlays = allOverlays.filter(o => o.type.includes("/information/")) as InformationOverlay[]

      it('properly defined', () => {
        const expected: {
          [lang: string]: { [attribute_name: string]: string }
        } = {
          pl_PL: {
            "attr_name": "pl info",
          },
          en_EN: {
            "attr_name": "en info",
          }
        }
        expect(overlays).to.lengthOf(2)

        overlays.forEach(overlay => {
          const exp = expected[overlay.language]
          expect(exp).to.exist
          expect(overlay.attribute_information).to.have.keys("attr_name")
          expect(overlay.attribute_information).to.have.property("attr_name", exp["attr_name"])
        })
      })
    })

    describe("Entry", () => {
      const overlays = allOverlays.filter(o => o.type.includes("/entry/")) as EntryOverlay[]

      it('properly defined', () => {
        const expected: {
          [lang: string]: { [attribute_name: string]: { [entry_code: string]: string } }
        } = {
          pl_PL: {
            "attr_name": { "o1": "opcja 1", "o2": "opcja 2" },
          },
          en_EN: {
            "attr_name": { "o1": "option 1", "o2": "option 2" },
          }
        }
        expect(overlays).to.lengthOf(2)

        overlays.forEach(overlay => {
          const exp = expected[overlay.language]
          expect(exp).to.exist
          expect(overlay.attribute_entries).to.have.keys("attr_name")
          expect(overlay.attribute_entries).to.have.property("attr_name")
            .that.have.property("o1", exp["attr_name"]["o1"])
          expect(overlay.attribute_entries).to.have.property("attr_name")
            .that.have.property("o2", exp["attr_name"]["o2"])
        })
      })
    })
  })
  */
})

/*
describe('Standard is invalid', () => {
  const attribute = new AttributeBuilder("attr", AttributeType.Text)
    .addStandard("invalid")
    .build()

  it('throws errors', () => {
    expect(() => {
      new OCABuilder(Encoding.Utf8)
        .addAttribute(attribute)
        .finalize()
    }).to.throw()
  })
})
*/
