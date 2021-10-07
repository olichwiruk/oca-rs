import { expect } from 'chai'
import { Attribute, AttributeType, Encoding, Entry, Language, OCA, Validator } from 'oca.js'

describe('Plain OCA is validated', () => {
  const oca = (new OCA(Encoding.Utf8)).finalize()
  const validator = new Validator()
  const result = validator.validate(oca)

  it('return success', () => {
    expect(result).to.haveOwnProperty("success")
    expect(result).to.haveOwnProperty("errors")

    expect(result.success).to.be.true
    expect(result.errors).to.be.an('array').that.is.empty
  })
})

describe('Translations are not enforced', () => {
  const oca = (new OCA(Encoding.Utf8))
    .addName({ [Language.En]: "OCA name" })
    .finalize()
  const validator = new Validator()
  const result = validator.validate(oca)

  it('return errors', () => {
    expect(result.success).to.be.false
    expect(result.errors).to.be.an('array').lengthOf(1)
  })
})

describe('Missing meta translations', () => {
  const oca = (new OCA(Encoding.Utf8))
    .addName({ [Language.En]: "OCA name" })
    .finalize()
  const validator = (new Validator())
    .enforceTranslations([Language.En, Language.Pl])
  const result = validator.validate(oca)

  it('return errors', () => {
    expect(result.success).to.be.false
    expect(result.errors).to.be.an('array').lengthOf(1)
  })

  describe('for name', () => {
    const oca = (new OCA(Encoding.Utf8))
      .addName({ [Language.En]: "OCA name" })
      .addDescription({
        [Language.En]: "OCA description",
        [Language.Pl]: "opis OCA"
      })
      .finalize()
    const validator = (new Validator())
      .enforceTranslations([Language.En, Language.Pl])
    const result = validator.validate(oca)

    it('return errors', () => {
      expect(result.success).to.be.false
      expect(result.errors).to.be.an('array').lengthOf(1)
    })
  })

  describe('for description', () => {
    const oca = (new OCA(Encoding.Utf8))
      .addName({
        [Language.En]: "OCA name",
        [Language.Pl]: "nazwa OCA"
      })
      .addDescription({
        [Language.En]: "OCA description",
      })
      .finalize()
    const validator = (new Validator())
      .enforceTranslations([Language.En, Language.Pl])
    const result = validator.validate(oca)

    it('return errors', () => {
      expect(result.success).to.be.false
      expect(result.errors).to.be.an('array').lengthOf(1)
    })
  })
})

describe('Missing overlay translations', () => {
  const oca = (new OCA(Encoding.Utf8))
    .addAttribute(
      (new Attribute("attr1", AttributeType.Text))
        .addLabel({ [Language.En]: "Attribute 1" })
        .addInformation({ [Language.En]: "Attribute 1 info" })
        .addEntries([new Entry("o1", { [Language.En]: "Option 1" })])
        .build()
    )
    .finalize()
  const validator = (new Validator())
    .enforceTranslations([Language.En, Language.Pl])
  const result = validator.validate(oca)

  it('return errors', () => {
    expect(result.success).to.be.false
    expect(result.errors).to.be.an('array').lengthOf(3)
  })
})
