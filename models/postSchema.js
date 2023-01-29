const mongoose=require('mongoose');
const Schema=mongoose.Schema;
const PostSchema=new Schema({
    title:{
        type:String,
        require:true
    },
    post:{
        type:String,
        require:true
    },
    author:{
        type:Schema.Types.ObjectId,
        ref:'User'
    }
})
module.exports=mongoose.model('Post',PostSchema);