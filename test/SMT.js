const Smt = artifacts.require("SMT");
const SmtLib = require('./helpers/SmtLib.js');

contract("Smt", () => {

  const leafOne = '0xa59a60d98b69a32028020fbf69c27dc2188b5756975e93b330a3f1513f383076';
  const leafTwo = '0x95d22ccdd977e992e4a530ce4f1304e1a7a1840823ea1b4f7bf3841049d197e0';
  const leafThree = '0x3d32085b3de13667b43fd7cecf200b347041918e259cbcc86796422a47fec794';
  //const leafZero = '0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563';
  const leafZero = '0x0000000000000000000000000000000000000000000000000000000000000000';

  it("should allow to verify proofs with single intersection", async() => {
    const smt = await Smt.new();
    const tree = new SmtLib(160, {
        '0x14ca9787e132a35034352ba86fc15d34b71531be': leafOne,
        '0x1fd600b4c58754b2c043d4f35c2eca42cfbdab7a': leafTwo,
    });
    let rsp = await smt.getRoot(leafOne, '0x14ca9787e132a35034352ba86fc15d34b71531be', tree.createMerkleProof('0x14ca9787e132a35034352ba86fc15d34b71531be'));
    assert.equal(rsp, tree.root);
  });


  it("should allow to verify proofs with single intersection", async() => {
    const smt = await Smt.new();
    const tree = new SmtLib(160, {
        '0x14ca9787e132a35034352ba86fc15d34b71531be' : leafOne,
        '0x1fd600b4c58754b2c043d4f35c2eca42cfbdab7a' : leafTwo,
    });
    let rsp = await smt.getRoot(leafOne, '0x14ca9787e132a35034352ba86fc15d34b71531be', tree.createMerkleProof('0x14ca9787e132a35034352ba86fc15d34b71531be'));
    assert.equal(rsp, tree.root);
    rsp = await smt.getRoot(leafTwo, '0x1fd600b4c58754b2c043d4f35c2eca42cfbdab7a', tree.createMerkleProof('0x1fd600b4c58754b2c043d4f35c2eca42cfbdab7a'));
    assert.equal(rsp, tree.root);
    rsp = await smt.getRoot(leafZero, 2, tree.createMerkleProof('2'));
    assert.equal(rsp, tree.root);
  });

  it("should allow to update root", async() => {
    const smt = await Smt.new();

    // write first leaf
    let tree = new SmtLib(160);
    await smt.write('0x14ca9787e132a35034352ba86fc15d34b71531be', leafZero, tree.createMerkleProof('0x14ca9787e132a35034352ba86fc15d34b71531be'), leafOne);

    // write second leaf
    tree = new SmtLib(160, { '0x14ca9787e132a35034352ba86fc15d34b71531be' : leafOne});
    await smt.write('0x1fd600b4c58754b2c043d4f35c2eca42cfbdab7a', leafZero, tree.createMerkleProof('0x1fd600b4c58754b2c043d4f35c2eca42cfbdab7a'), leafTwo);

    // read first leaf back
    tree = new SmtLib(160, {
      '0x14ca9787e132a35034352ba86fc15d34b71531be' : leafOne,
      '0x1fd600b4c58754b2c043d4f35c2eca42cfbdab7a' : leafTwo,
    });
    let rsp = await smt.read('0x14ca9787e132a35034352ba86fc15d34b71531be', leafOne, tree.createMerkleProof('0x14ca9787e132a35034352ba86fc15d34b71531be'));
    assert(rsp);
    // negative read test
    rsp = await smt.read('0x1fd600b4c58754b2c043d4f35c2eca42cfbdab7a', leafTwo, tree.createMerkleProof('0x14ca9787e132a35034352ba86fc15d34b71531be'));
    assert(!rsp);
    // read second leaf back
    rsp = await smt.read('0x1fd600b4c58754b2c043d4f35c2eca42cfbdab7a', leafTwo, tree.createMerkleProof('0x1fd600b4c58754b2c043d4f35c2eca42cfbdab7a'));
    assert(rsp);

    // delete test
    await smt.del('0x14ca9787e132a35034352ba86fc15d34b71531be', leafOne, tree.createMerkleProof('0x14ca9787e132a35034352ba86fc15d34b71531be'));

    // try to read what is left
    tree = new SmtLib(160, {
      '0x1fd600b4c58754b2c043d4f35c2eca42cfbdab7a' : leafTwo,
    });
    rsp = await smt.read('0x14ca9787e132a35034352ba86fc15d34b71531be', leafZero, tree.createMerkleProof('0x14ca9787e132a35034352ba86fc15d34b71531be'));
    assert(rsp, '0x14ca9787e132a35034352ba86fc15d34b71531be not contained');
    rsp = await smt.read('0x1fd600b4c58754b2c043d4f35c2eca42cfbdab7a', leafTwo, tree.createMerkleProof('0x1fd600b4c58754b2c043d4f35c2eca42cfbdab7a'));
    assert(rsp, '0x1fd600b4c58754b2c043d4f35c2eca42cfbdab7a not contained');
  });

  it("The allow to delete element", async() => {
    const smt = await Smt.new();

    // write first leaf
    let tree = new SmtLib(160);
    await smt.write('0x1fd600b4c58754b2c043d4f35c2eca42cfbdab7a', leafZero, tree.createMerkleProof('0x1fd600b4c58754b2c043d4f35c2eca42cfbdab7a'), leafTwo);

    const firstRoot = await smt.root();

    tree = new SmtLib(160, {
      '0x1fd600b4c58754b2c043d4f35c2eca42cfbdab7a' : leafTwo,
    });
    // write second leaf
    await smt.write('0x14ca9787e132a35034352ba86fc15d34b71531be', leafZero, tree.createMerkleProof('0x14ca9787e132a35034352ba86fc15d34b71531be'), leafOne);


    tree = new SmtLib(160, {
      '0x1fd600b4c58754b2c043d4f35c2eca42cfbdab7a' : leafTwo,
      '0x14ca9787e132a35034352ba86fc15d34b71531be' : leafOne,
    });
    // read first leaf back
    let rsp = await smt.read('0x1fd600b4c58754b2c043d4f35c2eca42cfbdab7a', leafTwo, tree.createMerkleProof('0x1fd600b4c58754b2c043d4f35c2eca42cfbdab7a'));
    assert(rsp);
    // read second leaf
    rsp = await smt.read('0x14ca9787e132a35034352ba86fc15d34b71531be', leafOne, tree.createMerkleProof('0x14ca9787e132a35034352ba86fc15d34b71531be'));
    assert(rsp);

    // delete test
    await smt.del('0x14ca9787e132a35034352ba86fc15d34b71531be', leafOne, tree.createMerkleProof('0x14ca9787e132a35034352ba86fc15d34b71531be'));

    tree = new SmtLib(160, {
      '0x1fd600b4c58754b2c043d4f35c2eca42cfbdab7a' : leafTwo,
    });
    const afterDeleteRoot = await smt.root();
    assert.equal(firstRoot, afterDeleteRoot);
    rsp = await smt.read('0x1fd600b4c58754b2c043d4f35c2eca42cfbdab7a', leafTwo, tree.createMerkleProof('0x1fd600b4c58754b2c043d4f35c2eca42cfbdab7a'));
    assert(rsp, 'reading last value fails');
  });

});
