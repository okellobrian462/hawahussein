var isArray = (function () {
    // Use compiler's own isArray when available
    if (Array.isArray) {
        return Array.isArray;
    }

    // Retain references to variables for performance
    // optimization
    var objectToStringFn = Object.prototype.toString,
        arrayToStringResult = objectToStringFn.call([]);

    return function (subject) {
        return objectToStringFn.call(subject) === arrayToStringResult;
    };
}());

function GetRequestObject(koObject) {
    var viewModelToUpdate = ko.mapping.toJS(koObject);
    for (var prop in viewModelToUpdate) {
        var parentProperty = viewModelToUpdate[prop];
        if (isArray(parentProperty)) {
            var arrayCopy = parentProperty.slice(0);
            parentProperty.length = 0;
            for (var i = 0; i < arrayCopy.length; i++) {
                if (prop != 'ArticleTypeFilters' && prop != 'SectionFilters' && typeof (arrayCopy[i].IsSelected) !== 'undefined') {
                    if (arrayCopy[i].IsSelected == true) {
                        parentProperty.push(arrayCopy[i]);
                    }
                } else {
                    parentProperty.push(arrayCopy[i]);
                }
            };
        }
        else {
            for (var childProp in parentProperty) {
                var childProperty = parentProperty[childProp];
                if (isArray(childProperty)) {
                    var arrayCopy = childProperty.slice(0);
                    childProperty.length = 0;
                    for (var i = 0; i < arrayCopy.length; i++) {
                        if (prop != 'ArticleTypeFilters' && typeof (arrayCopy[i].IsSelected) !== 'undefined') {
                            if (arrayCopy[i].IsSelected == true) {
                                childProperty.push(arrayCopy[i]);
                            }
                        } else {
                            childProperty.push(arrayCopy[i]);
                        }
                    };
                }
            }
        }
    }
    return viewModelToUpdate;
}

ko.bindingHandlers.bindFilterList = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var acInput = $(element);
        var observable = valueAccessor();
        var allBindings = allBindingsAccessor();
        var searchFilters = bindingContext.$root.SearchFilters;
        var root = bindingContext.$root;

        var requiredSelected = 'false';
        if (!!allBindings && !!allBindings.bindFilterListRequiredSelected && allBindings.bindFilterListRequiredSelected != '') {
            requiredSelected = allBindings.bindFilterListRequiredSelected;
        }
        observable.handleKeyUp = function (data, event) {
            if (event.which === 13) observable.toggleSingleSelectFilter(data, event);
            if (event.which == 40) {
                //down arrow
                if ($(event.target).next()) $(event.target).next().focus();
            }
            if (event.which == 38) {
                //down arrow
                if ($(event.target).prev()) $(event.target).prev().focus();
            }
            if (event.which == 27) {
                //esc key
                let dropdown = $(event.target).parent().parent();
                dropdown.focus();
                dropdown.removeClass('show-options');
            }
        }
        observable.toggleSingleSelectFilter = function (data, event) {
            var selectedItem = data || this;
            if (event)
                event.preventDefault();
            //event.stopPropagation();

            if (root.hasOwnProperty('HasPendingUpdates') && ko.isObservable(root['HasPendingUpdates'])) {
                root.HasPendingUpdates(true);
            }

            if (selectedItem.IsEnabled() == false) {
                if (selectedItem.IsSelected() == true) {
                    selectedItem.IsSelected(false);
                    if (!!allBindings && $.isFunction(allBindings.bindFilterListClearFunction)) {
                        allBindings.bindFilterListClearFunction(allBindings.bindFilterListSearchFunction);
                    } else {
                        if (!!allBindings && $.isFunction(allBindings.bindFilterListSearchFunction)) {
                            allBindings.bindFilterListSearchFunction();
                        }
                    }
                    if (!!allBindings && allBindings.bindFilterListDeleteOnSelect == true) {
                        observable.remove(selectedItem);
                    }
                }
                return;
            }

            if (selectedItem.IsSelected() == true) {
                if (requiredSelected == 'false') {
                    selectedItem.IsSelected(false);
                }
            } else {
                selectedItem.IsSelected(true);
                ko.utils.arrayForEach(observable(), function (item) {
                    if (item.IsSelected() == true && item.Name() != selectedItem.Name()) {
                        item.IsSelected(false);
                    }
                });
            }

            if ($.isFunction(selectedItem.ClearFilter)) {
                selectedItem.ClearFilter();
            } else {
                if (!!allBindings && $.isFunction(allBindings.bindFilterListClearFunction)) {
                    allBindings.bindFilterListClearFunction(allBindings.bindFilterListSearchFunction);
                } else {
                    if (!!allBindings && $.isFunction(allBindings.bindFilterListSearchFunction)) {
                        allBindings.bindFilterListSearchFunction();
                    }
                }
            }
            if (!!allBindings && allBindings.bindFilterListDeleteOnSelect == true) {
                observable.remove(selectedItem);
            }
        };

        observable.toggleMultiSelectFilter = function (data, event) {
            var selectedItem = this;
            event.preventDefault();
            //event.stopPropagation();

            if (root.hasOwnProperty('HasPendingUpdates') && ko.isObservable(root['HasPendingUpdates'])) {
                root.HasPendingUpdates(true);
            }

            if (selectedItem.IsEnabled() == false) {
                if (selectedItem.IsSelected() == true) {
                    selectedItem.IsSelected(false);
                    if (!!allBindings && $.isFunction(allBindings.bindFilterListClearFunction)) {
                        allBindings.bindFilterListClearFunction(allBindings.bindFilterListSearchFunction);
                    } else {
                        if (!!allBindings && $.isFunction(allBindings.bindFilterListSearchFunction)) {
                            allBindings.bindFilterListSearchFunction();
                        }
                    }
                }
                return;
            }
            if (selectedItem.IsSelected() == true) {
                selectedItem.IsSelected(false);
            } else {
                selectedItem.IsSelected(true);
            }
            if ($.isFunction(selectedItem.ClearFilter)) {
                selectedItem.ClearFilter();
            } else {
                if (!!allBindings && $.isFunction(allBindings.bindFilterListClearFunction)) {
                    allBindings.bindFilterListClearFunction(allBindings.bindFilterListSearchFunction);
                } else {
                    if (!!allBindings && $.isFunction(allBindings.bindFilterListSearchFunction)) {
                        allBindings.bindFilterListSearchFunction();
                    }
                }
            }
        };

        observable.toggleDateRangeFilter = function (data, event) {
            var selectedItem = this;
            event.preventDefault();
            event.stopPropagation();

            if (selectedItem.IsEnabled() == false) {
                return;
            }
            if (ko.isObservable(searchFilters.DateRangeFrom) && ko.isObservable(searchFilters.DateRangeTo)) {
                selectedItem.IsSelected((!!searchFilters.DateRangeFrom() && searchFilters.DateRangeFrom() != '') || (!!searchFilters.DateRangeTo() && searchFilters.DateRangeTo() != ''));
                if (viewModel.AllowMultiSelect() == false) {
                    ko.utils.arrayForEach(observable(), function (item) {
                        if (item.ID != selectedItem.ID) {
                            item.IsSelected(false);
                        }
                    });
                }
            }
        };

        observable.ClearAllFilters = function (data, event, setEnabled) {
            setEnabled = (typeof setEnabled !== 'undefined') ? setEnabled : true;
            ko.utils.arrayForEach(observable(), function (item) {
                if (setEnabled) {
                    item.IsEnabled(true);
                }
                item.IsSelected(false);
            });
            if (root.hasOwnProperty('HasPendingUpdates') && ko.isObservable(root['HasPendingUpdates'])) {
                root.HasPendingUpdates(true);
            }
            if (!!allBindings && $.isFunction(allBindings.bindFilterListSearchFunction)) {
                allBindings.bindFilterListSearchFunction();
            }
        };

        observable.SelectedText = function (defaultValue) {
            var selectedItem = ko.utils.arrayFirst(observable(), function (item) {
                return item.IsSelected();
            });
            if (selectedItem != null) {
                return selectedItem.Name();
            }
            return defaultValue;
        };

        observable.SelectedValue = function () {
            var selectedItem = ko.utils.arrayFirst(observable(), function (item) {
                return item.IsSelected();
            });
            if (selectedItem != null) {
                return selectedItem.ID();
            }
            return '';
        };

        observable.HasSelectedFilter = function () {
            var hasItem = ko.utils.arrayFirst(observable(), function (item) {
                return (item.IsSelected() == true);
            });
            if (hasItem != null) {
                return true;
            }
            return false;
        };
    }
}
