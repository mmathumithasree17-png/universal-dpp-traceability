const { mongoose, fileStore, getDbState } = require('../config/db');

// Matcher helper for simple MongoDB-like query objects
function matchesQuery(doc, query = {}) {
  for (const [key, val] of Object.entries(query)) {
    if (val === undefined) continue;

    // Handle $in operator
    if (val && typeof val === 'object' && Array.isArray(val.$in)) {
      const docVal = doc[key];
      if (Array.isArray(docVal)) {
        if (!docVal.some(item => val.$in.includes(item))) return false;
      } else {
        if (!val.$in.includes(docVal)) return false;
      }
      continue;
    }

    // Handle $regex operator
    if (val && typeof val === 'object' && val.$regex) {
      const regex = new RegExp(val.$regex, val.$options || 'i');
      if (!regex.test(String(doc[key] || ''))) return false;
      continue;
    }

    // Handle $or operator
    if (key === '$or' && Array.isArray(val)) {
      const orMatched = val.some(subQuery => matchesQuery(doc, subQuery));
      if (!orMatched) return false;
      continue;
    }

    // Handle simple equality
    if (doc[key] !== val) {
      return false;
    }
  }
  return true;
}

function createModel(modelName, schemaDef) {
  // Always create real Mongoose Schema and Model
  const schema = new mongoose.Schema(schemaDef, { timestamps: true });
  const MongoModel = mongoose.models[modelName] || mongoose.model(modelName, schema);
  const collectionKey = modelName.toLowerCase();

  return {
    mongoModel: MongoModel,
    schema,

    async find(query = {}) {
      const state = getDbState();
      if (state.mode === 'mongodb') {
        return MongoModel.find(query).lean();
      }
      const list = fileStore.getCollection(collectionKey);
      return list.filter(item => matchesQuery(item, query));
    },

    async findOne(query = {}) {
      const state = getDbState();
      if (state.mode === 'mongodb') {
        return MongoModel.findOne(query).lean();
      }
      const list = fileStore.getCollection(collectionKey);
      return list.find(item => matchesQuery(item, query)) || null;
    },

    async findById(id) {
      const state = getDbState();
      if (state.mode === 'mongodb') {
        return MongoModel.findById(id).lean();
      }
      const list = fileStore.getCollection(collectionKey);
      return list.find(item => item._id === String(id) || item.id === String(id)) || null;
    },

    async create(docData) {
      const state = getDbState();
      if (state.mode === 'mongodb') {
        const item = new MongoModel(docData);
        return item.save();
      }
      const list = fileStore.getCollection(collectionKey);
      const newDoc = {
        _id: docData._id || 'id_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...docData,
      };
      list.push(newDoc);
      fileStore.save();
      return newDoc;
    },

    async insertMany(docs) {
      const state = getDbState();
      if (state.mode === 'mongodb') {
        return MongoModel.insertMany(docs);
      }
      const list = fileStore.getCollection(collectionKey);
      const inserted = docs.map((d, index) => ({
        _id: d._id || 'id_' + (Date.now() + index) + '_' + Math.random().toString(36).substring(2, 8),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...d,
      }));
      list.push(...inserted);
      fileStore.save();
      return inserted;
    },

    async findByIdAndUpdate(id, updateData, options = { new: true }) {
      const state = getDbState();
      if (state.mode === 'mongodb') {
        return MongoModel.findByIdAndUpdate(id, updateData, options).lean();
      }
      const list = fileStore.getCollection(collectionKey);
      const index = list.findIndex(item => item._id === String(id) || item.id === String(id));
      if (index === -1) return null;
      list[index] = {
        ...list[index],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };
      fileStore.save();
      return list[index];
    },

    async updateOne(query, updateData) {
      const state = getDbState();
      if (state.mode === 'mongodb') {
        return MongoModel.updateOne(query, updateData);
      }
      const list = fileStore.getCollection(collectionKey);
      const item = list.find(it => matchesQuery(it, query));
      if (item) {
        Object.assign(item, updateData, { updatedAt: new Date().toISOString() });
        fileStore.save();
        return { modifiedCount: 1 };
      }
      return { modifiedCount: 0 };
    },

    async countDocuments(query = {}) {
      const state = getDbState();
      if (state.mode === 'mongodb') {
        return MongoModel.countDocuments(query);
      }
      const list = fileStore.getCollection(collectionKey);
      if (Object.keys(query).length === 0) return list.length;
      return list.filter(item => matchesQuery(item, query)).length;
    },

    async deleteMany(query = {}) {
      const state = getDbState();
      if (state.mode === 'mongodb') {
        return MongoModel.deleteMany(query);
      }
      if (Object.keys(query).length === 0) {
        fileStore.data[collectionKey] = [];
        fileStore.save();
        return { deletedCount: 'all' };
      }
      const list = fileStore.getCollection(collectionKey);
      const remaining = list.filter(item => !matchesQuery(item, query));
      const deletedCount = list.length - remaining.length;
      fileStore.data[collectionKey] = remaining;
      fileStore.save();
      return { deletedCount };
    }
  };
}

module.exports = {
  createModel,
};
