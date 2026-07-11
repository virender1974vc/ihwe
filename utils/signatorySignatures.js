const User = require("../models/User");

const normalizeName = (value) => String(value || "").trim().toLowerCase();
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const attachSignatureToPerson = (person, userByName) => {
  if (!person || typeof person !== "object") return person;
  const user = userByName.get(normalizeName(person.name));
  return {
    ...person,
    signatureImage: person.signatureImage || user?.signatureImage || "",
  };
};

const attachSignatorySignatures = async (doc) => {
  if (!doc) return doc;

  const names = [doc.preparedBy?.name, doc.reviewedBy?.name].filter(Boolean);
  if (!names.length) return doc;

  const users = await User.find({
    $or: names.map((name) => ({ fullName: new RegExp(`^${escapeRegex(name)}$`, "i") })),
  }, "fullName signatureImage").lean();
  const userByName = new Map(users.map((user) => [normalizeName(user.fullName), user]));

  return {
    ...doc,
    preparedBy: attachSignatureToPerson(doc.preparedBy, userByName),
    reviewedBy: attachSignatureToPerson(doc.reviewedBy, userByName),
  };
};

const attachSignatorySignaturesToMany = async (docs = []) => Promise.all(docs.map(attachSignatorySignatures));

module.exports = {
  attachSignatorySignatures,
  attachSignatorySignaturesToMany,
};
