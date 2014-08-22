$(document).ready(function() {
  $('#partner').click(function() {
    $('.b-partner').toggle('slow')
  })
  $('body').on('change', '.b-reg-input', function(){
    if ($(this).val() !== '') {
      $(this).css({opacity: 1});
    } else if ($(this).val() == '') {
      $(this).css({opacity: 0});
    }
  });
  $('#reg').validate({
    errorClass: 'g-danger',
    validClass: 'g-success',
    highlight: function(element, errorClass, validClass) {
      $(element).parent().addClass(errorClass).removeClass(validClass);
    },
    unhighlight: function(element, errorClass, validClass) {
      $(element).parent().removeClass(errorClass).addClass(validClass);
    },
    rules: {
      shop: {
        required: true
      },
      email: {
        required: true,
        email: true
      },
      fio: {
        required: true
      },
      phone: {
        required: true,
        number: true
      }
    },
    messages: {
      login: {
        required: ''
      },
      email: {
        required: '',
        email: ''
      },
      password: {
        required: ''
      },
      fio: {
        required: ''
      },
      phone: {
        required: '',
        number: ''
      }
    },
    submitHandler: function(form) {
      $(form).ajaxSubmit({
        success: function (response) {
          if (response == 'success') {
            window.location.replace('/dashboard');
          }
        }
      });
      return false;
    }
  })
  $('#remember').validate({
    errorClass: 'g-danger',
    validClass: 'g-success',
    highlight: function(element, errorClass, validClass) {
      $(element).parent().addClass(errorClass).removeClass(validClass);
    },
    unhighlight: function(element, errorClass, validClass) {
      $(element).parent().removeClass(errorClass).addClass(validClass);
    },
    rules: {
      email: {
        required: true,
        email: true
      }
    },
    messages: {
      email: {
        required: '',
        email: ''
      }
    },
    submitHandler: function(form) {
      $(form).ajaxSubmit({
        success: function (response) {
          if (response == 'success') {
            window.location.replace('/login');
          }
        }
      });
      return false;
    }
  })
  $('#login').validate({
    errorClass: 'g-danger',
    validClass: 'g-success',
    highlight: function(element, errorClass, validClass) {
      $(element).parent().addClass(errorClass).removeClass(validClass);
    },
    unhighlight: function(element, errorClass, validClass) {
      $(element).parent().removeClass(errorClass).addClass(validClass);
    },
    rules: {
      login: {
        required: true
      },
      pass: {
        required: true
      }
    },
    messages: {
      login: {
        required: ''
      },
      pass: {
        required: ''
      }
    },
    submitHandler: function(form) {
      $(form).ajaxSubmit({
        success: function (response) {
          if (response == 'success') {
            window.location.replace('/dashboard');
          }
        }
      });
      return false;
    }
  })
  $('body').on('click', '#turn', function(){
    $.ajax({
      url: '/service'
    })
    .done(function(response) {
      if (response == 'on') {
        $('#turn').removeClass('b-turn-off').addClass('b-turn-on');
        $('.b-app').removeClass('b-app-off').addClass('b-app-on');
      } else if (response == 'off') {
        $('#turn').removeClass('b-turn-on').addClass('b-turn-off');
        $('.b-app').removeClass('b-app-on').addClass('b-app-off');
      }
    });
  });
});