const normalizeDisplayOrder = (value, fallback = 1) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.trunc(parsed));
};

const resequenceDisplayOrder = async (Model, targetId, requestedOrder) => {
  const allDocs = await Model.find()
    .sort({ display_order: 1, name: 1, cat_name: 1, nature_name: 1, _id: 1 })
    .lean();

  const targetIdText = targetId.toString();
  const targetDoc = allDocs.find((doc) => doc._id.toString() === targetIdText);
  if (!targetDoc) return;

  const fallbackOrder = allDocs.length;
  const nextOrder = normalizeDisplayOrder(requestedOrder, fallbackOrder);
  const targetIndex = Math.min(
    nextOrder <= 0 ? 0 : nextOrder - 1,
    allDocs.length - 1,
  );

  const orderedIds = allDocs
    .filter((doc) => doc._id.toString() !== targetIdText)
    .map((doc) => doc._id.toString());
  orderedIds.splice(targetIndex, 0, targetId.toString());
  const startsAtZero = nextOrder === 0;

  await Promise.all(
    orderedIds.map((id, index) =>
      Model.updateOne(
        { _id: id },
        { $set: { display_order: startsAtZero ? index : index + 1 } },
      ),
    ),
  );
};

module.exports = {
  normalizeDisplayOrder,
  resequenceDisplayOrder,
};
