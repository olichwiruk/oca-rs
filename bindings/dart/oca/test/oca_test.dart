import 'dart:ffi';

import 'package:oca/oca.dart';
import 'package:test/test.dart';

void main() {
  test('it works', () async {
    final dylib = DynamicLibrary.open("../target/debug/libocadart.so");

    late final api = OcaDartImpl(dylib);

    final ocaBox = await OcaBox.newOcaBox(bridge: api)
      ..addMetaAttr(name: "name", value: "value")
      ..addMetaAttr(name: "description", value: "Test case OCA");

    final attr1 = await OcaAttr.newOcaAttr(
        bridge: api,
        name: "name",
        attrType: OcaAttrType.Text,
        encoding: OcaEncoding.Utf8)
      ..setCardinality(cardinality: "1");
    await ocaBox.addAttr(attr: attr1);

    final attr2 = await OcaAttr.newOcaAttr(
        bridge: api,
        name: "age",
        attrType: OcaAttrType.Numeric,
        encoding: OcaEncoding.Utf8)
      ..setCardinality(cardinality: "2")
      ..setConformance(conformance: "M")
      ..setFlagged();
    await ocaBox.addAttr(attr: attr2);

    final ocaBundle = await ocaBox.generateBundle();

    print(await ocaBundle.toJson());

    final capBase = await ocaBundle.captureBase();

    expect((await capBase.attributes()).length, 2);
    expect((await capBase.flaggedAttributes()).length, 1);
    // expect((await capBase.overlays()).length, 5);
  });
}
