$(document).ready(function () {
    $('#add').click(function () { 
        $('#myModal').modal('show')
    });

    $('.note').click(function(){
        var index = $(this).index('.note')
        
        $('#title').val($('#title-'+index).val())
        $('#desc').val($('#desc-'+index).val())
        $('#note_id').val($('#_id-'+index).val())
        $('#updateModal').modal('show')
    })

    
  
    $('.delete').click(function(){
        if(confirm('Delete note?')){
          var index = $(this).index('.delete')
        var id = $('#_id-'+index).val();
        $.ajax({
            type: "DELETE",
            url: "/deletenote",
            data: {'deleteid':id},
            success: function (response) {
                window.location.href = '/home?deleted=true';            
            }
        });  
        }        
    })
});