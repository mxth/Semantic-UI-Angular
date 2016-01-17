///<reference path="../../../typings/angularjs/angular.d.ts"/>

const ratingConfig = {
  max: 5,
  stateActive: 'active',
  stateHover: 'selected',
  stateHoverParent: 'selected',
  type: 'star',
  size: ''
};

class SmRatingController {
  static $inject = ['$scope', '$element', '$attrs'];

  value;
  hoverValue;
  readonly: boolean;

  onHover;
  onLeave;

  stateActive;
  stateHover;
  stateHoverParent;

  ratingStates;
  range: any[];

  ngModel: ng.INgModelController;

  constructor(public $scope: ng.IScope, public $element: ng.IAugmentedJQuery, public $attrs) {
    $element
      .addClass('ui rating')
      .addClass($attrs.type || ratingConfig.type)
      .addClass($attrs.size || ratingConfig.size)
      .attr({
        tabindex: 0,
        role: 'slider',
        'aria-valuemin': 0
      });

    if (angular.isDefined($attrs.readonly)) {
      $scope.$watch($attrs.readonly, (readonly: boolean) => {
        this.readonly = readonly;
      });
    }

    this.onHover = (value) => {
      if (angular.isDefined($attrs.onHover)) {
        $scope.$eval($attrs.onHover, { $value: value });
      }
    };

    this.onLeave = () => {
      if (angular.isDefined($attrs.onLeave)) {
        $scope.$eval($attrs.onLeave);
      }
    };

    this.stateActive = this.evalAttribute('stateActive') ;
    this.stateHover = this.evalAttribute('stateHover');
    this.stateHoverParent = this.evalAttribute('stateHoverParent');

    this.ratingStates = this.evalAttribute('ratingStates') || new Array(this.evalAttribute('max'));
    this.range = this.buildTemplateObjects();

    this.range.forEach(function(icon, index) {
      const iconElm = angular.element('<i class="icon"></i>');
      iconElm.on('mouseenter', function() {
        $scope.$apply(function() {
          this.enter(index + 1);
        });
      });
      iconElm.on('click', function() {
        $scope.$apply(function() {
          this.rate(index + 1);
        });
      });
      icon.element = iconElm;

      $element.append(iconElm);
    });

    $element.attr('aria-valuemax', this.range.length);

    $element.on('mouseleave', onMouseLeave);
    $element.on('keydown', onKeydown);

    function onMouseLeave() {
      $scope.$apply(function() {
        this.hoverValue = -1;
        this.onLeave();
        $element.removeClass(this.stateHoverParent);
        this.updateStateHover();
      });
    }

    function onKeydown(evt) {
      if (/(37|38|39|40)/.test(evt.which)) {
        evt.preventDefault();
        evt.stopPropagation();
        $scope.$apply(function() {
          this.rate(this.value + (evt.which === 38 || evt.which === 39 ? 1 : -1));
        });
      }
    }
  }

  buildTemplateObjects() {
    return this.ratingStates.map((state, index) => angular.extend({
      index: index,
      stateActive: this.stateActive,
      stateHover: this.stateHover
    }, state));
  }

  rate(value) {
    if (!this.readonly && value >= 0 && value <= this.range.length) {
      this.ngModel.$setViewValue(value);
      this.ngModel.$render();
    }
  }

  init(ngModel: ng.INgModelController) {
    this.ngModel = ngModel;

    ngModel.$render = () => {
      this.value = this.ngModel.$viewValue;
      this.$element.attr('aria-valuenow', this.value);

    };
  }

  enter(value) {
    if (!this.readonly) {
      this.hoverValue = value;
      this.$element.addClass(this.stateHoverParent);
      this.updateStateHover();
    }
  }

  updateStateHover() {
    this.range.forEach((icon, index) => {
      icon.element[index < this.hoverValue ? 'addClass' : 'removeClass'](icon.stateHover);
    });
  }

  evalAttribute(attr: string) {
    return angular.isDefined(this.$attrs[attr]) ?
      this.$scope.$eval(this.$attrs[attr]) :
      ratingConfig[attr];
  }
}

class SmRatingDirective implements ng.IDirective {
  static instance(): ng.IDirective {
    return new SmRatingDirective;
  }

  restrict = 'E';
  require = ['smRating', 'ngModel'];
  controller = SmRatingController;
  link = (scope, element, attrs, ctrls: [SmRatingController, ng.INgModelController]) => {
    const [smRating, ngModel] = ctrls;
    smRating.init(ngModel);
  };
}

angular
  .module('semantic.ui.modules.rating', [])
  .directive('smRating', SmRatingDirective.instance)
  .constant('ratingConfig', ratingConfig);
