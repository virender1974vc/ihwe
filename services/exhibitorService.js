const Exhibitor = require('../models/Exhibitor');
class ExhibitorService {
    async getAllExhibitors(filters = {}) {
        let query = {};
        if (filters.category && filters.category !== 'ALL') {
            query.category = filters.category;
        }
        if (filters.search) {
            query.$or = [
                { title: { $regex: filters.search, $options: 'i' } },
                { location: { $regex: filters.search, $options: 'i' } }
            ];
        }

        const page = parseInt(filters.page);
        const limit = parseInt(filters.limit);
        const mongoQuery = Exhibitor.find(query).sort({ order: 1, createdAt: -1 });

        if (!isNaN(page) && !isNaN(limit)) {
            const skip = (page - 1) * limit;
            const [data, total] = await Promise.all([
                Exhibitor.find(query).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit),
                Exhibitor.countDocuments(query)
            ]);
            return {
                data,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        }

        const data = await mongoQuery;
        return { data };
    }
    async getExhibitorById(id) {
        return await Exhibitor.findById(id);
    }
    async addExhibitor(data) {
        const newExhibitor = new Exhibitor(data);
        return await newExhibitor.save();
    }
    async updateExhibitor(id, data) {
        return await Exhibitor.findByIdAndUpdate(id, data, { new: true });
    }
    async deleteExhibitor(id) {
        const result = await Exhibitor.findByIdAndDelete(id);
        await this.rebalanceOrders();
        return result;
    }
    async getMaxOrder() {
        const lastExhibitor = await Exhibitor.findOne().sort({ order: -1 });
        return lastExhibitor ? lastExhibitor.order : 0;
    }
    async reorderExhibitor(id, targetId, mode = 'swap', targetOrder = null) {
        const item = await Exhibitor.findById(id);
        if (!item) return;

        let newOrder;
        if (targetId) {
            const target = await Exhibitor.findById(targetId);
            if (!target) return;
            newOrder = target.order;
            
            if (mode === 'swap') {
                const oldOrder = item.order;
                item.order = target.order;
                target.order = oldOrder;
                await Promise.all([item.save(), target.save()]);
                await this.rebalanceOrders();
                return;
            }
        } else if (targetOrder !== null) {
            newOrder = targetOrder;
        } else {
            return;
        }

        // 'shift' mode logic (either targetId or targetOrder)
        const oldOrder = item.order;

        if (newOrder < oldOrder) {
            // Moving up: Increment items between newOrder and oldOrder-1
            await Exhibitor.updateMany(
                { order: { $gte: newOrder, $lt: oldOrder } },
                { $inc: { order: 1 } }
            );
        } else if (newOrder > oldOrder) {
            // Moving down: Decrement items between oldOrder+1 and newOrder
            await Exhibitor.updateMany(
                { order: { $gt: oldOrder, $lte: newOrder } },
                { $inc: { order: -1 } }
            );
        }
        
        item.order = newOrder;
        await item.save();
        await this.rebalanceOrders();
    }

    async rebalanceOrders() {
        const exhibitors = await Exhibitor.find().sort({ order: 1, createdAt: -1 });
        const bulkOps = exhibitors.map((ex, idx) => ({
            updateOne: {
                filter: { _id: ex._id },
                update: { $set: { order: idx } }
            }
        }));
        if (bulkOps.length > 0) {
            await Exhibitor.bulkWrite(bulkOps);
        }
    }
}

module.exports = new ExhibitorService();
