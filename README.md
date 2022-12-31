# jquery-minimalist-lookup-modal-bs
Jquery plugin for create minimalist lookup modal bootstrap 4

Example usage

```html
<div class="modal fade modal-user-filter"></div>
```

```javascript
// Init
let $lookupUser = $('.modal-user-filter').lookupModal({
  listTitle: 'Users',
  searchPlaceholder: 'Search user',
  ajaxUrl: '/get_users',
  localStorage: 'select-user-click-history',
  itemKey: 'user_id',
  displayItem: '%first_name% %last_name%',
  skipEmptySearch: true,
  callbackOnClickItem: function (modal, param) {

    modal.close();
  }
});

// Accessing method
// $lookupUser.data('lookup.modal')
```
